"""
ZeroTrace AI-MRV Triangulation & Anomaly Detection Engine
Uses Isolation Forest (scikit-learn), multi-source statistical Z-scores,
and CEA/MNRE regional baseline models to compute RiskScores and Explainable Alerts.
"""

from typing import List, Dict, Any, Tuple
import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from app.mrv.baseline_data import get_region_benchmark, DIURNAL_SOLAR_CURVE

class MRVVerificationEngine:
    def __init__(self):
        pass

    def evaluate_telemetry_batch(
        self,
        project: Any,
        data_points: List[Dict[str, Any]],
        satellite_irradiance_avg: float = None
    ) -> Dict[str, Any]:
        """
        Processes multi-source telemetry, executes Isolation Forest and heuristic triangulation,
        calculates RiskScore (0-100), ExplainableAlerts, and conservative validated MWh.
        """
        if not data_points:
            return {
                "risk_score": 100.0,
                "validated_mwh": 0.0,
                "requested_mwh": 0.0,
                "co2_offset_tonnes": 0.0,
                "alerts": [
                    {
                        "severity": "CRITICAL",
                        "category": "DATA_MISSING",
                        "title": "Empty Telemetry Batch",
                        "description": "No data points were provided in the telemetry payload.",
                        "impact_mwh": 0.0
                    }
                ],
                "ai_metrics": {}
            }

        df = pd.DataFrame(data_points)

        # Standardize expected columns
        if "scada_active_power_mw" not in df.columns:
            df["scada_active_power_mw"] = 0.0
        if "grid_export_power_mw" not in df.columns:
            df["grid_export_power_mw"] = 0.0
        if "global_horizontal_irradiance" not in df.columns:
            df["global_horizontal_irradiance"] = 0.0
        if "inverter_efficiency_pct" not in df.columns:
            df["inverter_efficiency_pct"] = 98.0

        # Calculate basic totals (assuming 1-hour intervals or delta-t based)
        scada_total_mwh = float(df["scada_active_power_mw"].sum())
        grid_export_total_mwh = float(df["grid_export_power_mw"].sum())
        total_hours = len(df)
        peak_capacity = project.peak_capacity_mw if project.peak_capacity_mw > 0 else 50.0

        # Capacity Utilization Factor (CUF) = Total MWh / (Peak MW * total_hours)
        cuf = scada_total_mwh / (peak_capacity * max(total_hours, 1))
        region_benchmark = get_region_benchmark(project.location)
        expected_cuf = region_benchmark["expected_cuf"]

        # Run AI Isolation Forest
        anomaly_ratio, iforest_score = self._run_isolation_forest(df)

        # Cross-Source Disparity
        disparity_mwh = scada_total_mwh - grid_export_total_mwh
        disparity_pct = (disparity_mwh / scada_total_mwh * 100.0) if scada_total_mwh > 0 else 0.0

        alerts: List[Dict[str, Any]] = []
        risk_components: List[float] = []

        # 1. Check Cross-Source SCADA vs Grid Export Disparity
        if disparity_pct > 15.0:
            alerts.append({
                "severity": "CRITICAL",
                "category": "DISPARITY",
                "title": "Severe SCADA Over-Reporting vs Grid Export Meter",
                "description": f"SCADA claims {scada_total_mwh:.2f} MWh while Bidirectional Grid Export meter confirms only {grid_export_total_mwh:.2f} MWh ({disparity_pct:.1f}% discrepancy).",
                "impact_mwh": max(0.0, disparity_mwh)
            })
            risk_components.append(min(80.0, disparity_pct * 2.2))
        elif disparity_pct > 5.0:
            alerts.append({
                "severity": "MEDIUM",
                "category": "DISPARITY",
                "title": "Moderate Meter Calibration Discrepancy",
                "description": f"Reported SCADA is {disparity_pct:.1f}% higher than grid export meter. Standard line loss tolerance is ~3.5%.",
                "impact_mwh": max(0.0, disparity_mwh)
            })
            risk_components.append(disparity_pct * 1.5)
        elif disparity_pct < -10.0:
            alerts.append({
                "severity": "LOW",
                "category": "DISPARITY",
                "title": "Under-reported SCADA vs Grid Injected Energy",
                "description": f"Grid meter recorded higher export than internal SCADA by {abs(disparity_pct):.1f}%.",
                "impact_mwh": 0.0
            })
            risk_components.append(5.0)
        else:
            risk_components.append(2.0)

        # 2. Check Generation During Zero-Irradiance / Night Hours (Solar projects)
        if project.project_type.value == "SOLAR":
            night_generation = 0.0
            for idx, row in df.iterrows():
                ghi = row.get("global_horizontal_irradiance", 0.0)
                power = row.get("scada_active_power_mw", 0.0)
                if ghi < 5.0 and power > (peak_capacity * 0.05):
                    night_generation += power

            if night_generation > 0.0:
                alerts.append({
                    "severity": "CRITICAL",
                    "category": "NIGHT_GENERATION",
                    "title": "Phantom Generation Detected During Zero Irradiance",
                    "description": f"Detected {night_generation:.2f} MWh generated during night/zero-irradiance conditions (GHI < 5 W/m²).",
                    "impact_mwh": night_generation
                })
                risk_components.append(50.0)

        # 3. Check Capacity Utilization Factor (CUF) against CEA/MNRE regional baseline
        cuf_diff = cuf - expected_cuf
        if cuf > region_benchmark["max_cuf"] * 1.25:
            alerts.append({
                "severity": "HIGH",
                "category": "BASELINE_ANOMALY",
                "title": "Generation Exceeds Regional Physical Limit",
                "description": f"Plant CUF of {cuf*100:.1f}% exceeds CEA regional maximum physical potential ({region_benchmark['max_cuf']*100:.1f}%) for {project.location}.",
                "impact_mwh": (cuf - region_benchmark['max_cuf']) * peak_capacity * total_hours
            })
            risk_components.append(35.0)
        elif cuf < region_benchmark["min_cuf"] * 0.5 and total_hours >= 24:
            alerts.append({
                "severity": "LOW",
                "category": "BASELINE_ANOMALY",
                "title": "Low Generation Period (Sub-optimal Yield)",
                "description": f"Plant recorded {cuf*100:.1f}% CUF, significantly below typical regional average ({expected_cuf*100:.1f}%). Possible curtailment or heavy cloud cover.",
                "impact_mwh": 0.0
            })
            risk_components.append(5.0)

        # 4. Inverter Efficiency Check
        abnormal_inverters = df[(df["inverter_efficiency_pct"] > 100.0) | (df["inverter_efficiency_pct"] < 80.0)]
        if len(abnormal_inverters) > 0:
            avg_eff = df["inverter_efficiency_pct"].mean()
            alerts.append({
                "severity": "MEDIUM",
                "category": "INVERTER_DEGRADATION",
                "title": "Inverter Anomaly / Sensor Miscalibration",
                "description": f"{len(abnormal_inverters)} hours had anomalous inverter efficiency metrics (average batch efficiency: {avg_eff:.1f}%).",
                "impact_mwh": 0.0
            })
            risk_components.append(15.0)

        # 5. Satellite Cross-Correlation Check
        sat_corr = 0.95
        if satellite_irradiance_avg is not None and satellite_irradiance_avg > 0:
            # Compare daylight GHI (where GHI > 10 W/m2)
            daylight_df = df[df["global_horizontal_irradiance"] > 10.0]
            scada_avg_ghi = daylight_df["global_horizontal_irradiance"].mean() if len(daylight_df) > 0 else df["global_horizontal_irradiance"].mean()
            sat_ratio = abs(scada_avg_ghi - satellite_irradiance_avg) / satellite_irradiance_avg
            if sat_ratio > 0.30:
                alerts.append({
                    "severity": "HIGH",
                    "category": "SATELLITE_DEVIATION",
                    "title": "Satellite Irradiance Triangulation Divergence",
                    "description": f"On-site daylight pyranometer average ({scada_avg_ghi:.1f} W/m²) deviates by {sat_ratio*100:.1f}% from Copernicus/NASA POWER satellite model ({satellite_irradiance_avg:.1f} W/m²).",
                    "impact_mwh": 0.0
                })
                risk_components.append(25.0)
                sat_corr = max(0.4, 1.0 - sat_ratio)
            else:
                sat_corr = max(0.85, 1.0 - sat_ratio)

        # 6. Isolation Forest Anomaly Component
        if anomaly_ratio > 0.20:
            alerts.append({
                "severity": "MEDIUM",
                "category": "ML_OUTLIER",
                "title": "Isolation Forest Multivariate Outliers",
                "description": f"AI model flagged {anomaly_ratio*100:.1f}% of telemetry frames as anomalous multivariate states.",
                "impact_mwh": 0.0
            })
            risk_components.append(anomaly_ratio * 40.0)

        # Compute Composite RiskScore (0 to 100)
        base_risk = sum(risk_components)
        final_risk_score = float(min(100.0, max(1.5, base_risk)))

        # Determine conservative validated MWh:
        # Conservative baseline rule: validated generation cannot exceed verified grid export meter.
        validated_mwh = min(scada_total_mwh, grid_export_total_mwh)
        
        # Deduct phantom night generation if any
        if project.project_type.value == "SOLAR" and 'night_generation' in locals():
            validated_mwh = max(0.0, validated_mwh - night_generation)

        # Calculate CO2 Offset (tCO2e)
        grid_emission_factor = project.grid_emission_factor or 0.716
        co2_offset_tonnes = float(round(validated_mwh * grid_emission_factor, 4))

        # Recommended Action for HITL
        if final_risk_score < 25.0:
            rec_action = "RECOMMEND_APPROVAL"
        elif final_risk_score < 60.0:
            rec_action = "REQUIRES_VERIFIER_REVIEW"
        else:
            rec_action = "RECOMMEND_REJECTION"

        ai_metrics = {
            "scada_total_mwh": round(scada_total_mwh, 3),
            "grid_export_total_mwh": round(grid_export_total_mwh, 3),
            "disparity_pct": round(disparity_pct, 2),
            "capacity_utilization_factor": round(float(cuf), 4),
            "baseline_expected_cuf": round(float(expected_cuf), 4),
            "satellite_correlation_score": round(float(sat_corr), 3),
            "isolation_forest_anomaly_ratio": round(float(anomaly_ratio), 3),
            "recommended_action": rec_action
        }

        return {
            "risk_score": round(final_risk_score, 1),
            "requested_mwh": round(scada_total_mwh, 3),
            "validated_mwh": round(validated_mwh, 3),
            "co2_offset_tonnes": co2_offset_tonnes,
            "alerts": alerts,
            "ai_metrics": ai_metrics
        }

    def _run_isolation_forest(self, df: pd.DataFrame) -> Tuple[float, float]:
        """Runs scikit-learn Isolation Forest on multi-variate telemetry"""
        try:
            features = ["scada_active_power_mw", "grid_export_power_mw", "global_horizontal_irradiance", "inverter_efficiency_pct"]
            X = df[features].copy().fillna(0.0)

            if len(X) < 5:
                return 0.0, 0.0

            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            clf = IsolationForest(
                n_estimators=100,
                contamination=0.1,
                random_state=42
            )
            preds = clf.fit_predict(X_scaled)
            scores = clf.decision_function(X_scaled)

            # In scikit-learn, -1 indicates outlier, 1 indicates inlier
            anomalies = (preds == -1).sum()
            anomaly_ratio = float(anomalies / len(df))
            avg_decision_score = float(scores.mean())

            return anomaly_ratio, avg_decision_score
        except Exception:
            return 0.0, 0.0

mrv_engine = MRVVerificationEngine()
