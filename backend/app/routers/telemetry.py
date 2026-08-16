from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import datetime
import hashlib
import uuid
import pandas as pd
import io

from app.database import get_db
from app import models, schemas
from app.mrv.engine import mrv_engine

router = APIRouter(prefix="/telemetry", tags=["Telemetry Ingestion"])

@router.post("/ingest", response_model=schemas.ClaimResponse, status_code=201)
def ingest_telemetry(payload: schemas.TelemetryIngestRequest, db: Session = Depends(get_db)):
    """
    Ingest multi-source operational telemetry (SCADA, Grid Export, Irradiance, Inverter metrics),
    execute automated AI-MRV triangulation and Isolation Forest anomaly analysis,
    and generate a verifiable Claim for verifier triage.
    """
    project = db.query(models.Project).filter(models.Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find or auto-create corporate user
    user = db.query(models.User).filter(models.User.wallet_address == payload.corporate_wallet.lower()).first()
    if not user:
        user = models.User(
            wallet_address=payload.corporate_wallet.lower(),
            organization_name=f"Corporate Partner ({payload.corporate_wallet[:6]}...{payload.corporate_wallet[-4:]})",
            role=models.UserRole.CORPORATE
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Convert data points to dict list
    data_points_dict = [dp.model_dump() for dp in payload.data_points]

    # Run AI-MRV Verification Engine
    mrv_result = mrv_engine.evaluate_telemetry_batch(
        project=project,
        data_points=data_points_dict,
        satellite_irradiance_avg=payload.satellite_irradiance_avg
    )

    # Compute raw batch totals
    scada_raw = mrv_result["requested_mwh"]
    grid_export_raw = mrv_result["ai_metrics"].get("grid_export_total_mwh", 0.0)

    # Ingestion hash
    raw_payload_str = json.dumps(data_points_dict, sort_keys=True)
    ingestion_hash = "0x" + hashlib.sha256(raw_payload_str.encode()).hexdigest()

    # Parse period start & end
    try:
        p_start = datetime.datetime.fromisoformat(payload.period_start.replace("Z", "+00:00"))
    except Exception:
        p_start = datetime.datetime.utcnow() - datetime.timedelta(days=1)

    try:
        p_end = datetime.datetime.fromisoformat(payload.period_end.replace("Z", "+00:00"))
    except Exception:
        p_end = datetime.datetime.utcnow()

    # Create TelemetryBatch
    batch_ref = f"BATCH-{project.project_code}-{uuid.uuid4().hex[:8].upper()}"
    batch = models.TelemetryBatch(
        project_id=project.id,
        batch_reference=batch_ref,
        period_start=p_start,
        period_end=p_end,
        scada_raw_mwh=scada_raw,
        grid_export_mwh=grid_export_raw,
        satellite_irradiance_avg=payload.satellite_irradiance_avg,
        data_points_count=len(payload.data_points),
        raw_data_json=raw_payload_str,
        ingestion_hash=ingestion_hash
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # Determine initial status
    risk_score = mrv_result["risk_score"]
    status = models.ClaimStatus.FLAGGED if risk_score >= 60.0 else models.ClaimStatus.PENDING_REVIEW

    # Create Claim
    claim_uid = f"CLM-{project.project_code}-{uuid.uuid4().hex[:8].upper()}"
    claim = models.Claim(
        claim_uid=claim_uid,
        corporate_id=user.id,
        corporate_wallet=payload.corporate_wallet.lower(),
        project_id=project.id,
        batch_id=batch.id,
        vintage_year=payload.vintage_year,
        requested_mwh=mrv_result["requested_mwh"],
        validated_mwh=mrv_result["validated_mwh"],
        co2_offset_tonnes=mrv_result["co2_offset_tonnes"],
        risk_score=risk_score,
        status=status,
        explainable_alerts_json=json.dumps(mrv_result["alerts"]),
        ai_metrics_json=json.dumps(mrv_result["ai_metrics"]),
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    return _build_claim_response(claim, project, batch)

@router.post("/upload-csv", response_model=schemas.ClaimResponse, status_code=201)
async def upload_telemetry_csv(
    project_id: int = Form(...),
    corporate_wallet: str = Form(...),
    vintage_year: int = Form(2026),
    file: UploadFile = File(...),
    satellite_irradiance_avg: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload a CSV file of SCADA & Grid Export telemetry directly.
    Required CSV headers: timestamp, scada_active_power_mw, grid_export_power_mw, global_horizontal_irradiance, inverter_efficiency_pct
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    # Check / fill columns
    if "scada_active_power_mw" not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required column 'scada_active_power_mw'")

    if "grid_export_power_mw" not in df.columns:
        df["grid_export_power_mw"] = df["scada_active_power_mw"] * 0.98

    if "global_horizontal_irradiance" not in df.columns:
        df["global_horizontal_irradiance"] = 600.0

    if "inverter_efficiency_pct" not in df.columns:
        df["inverter_efficiency_pct"] = 98.2

    if "timestamp" not in df.columns:
        now = datetime.datetime.utcnow()
        df["timestamp"] = [(now + datetime.timedelta(hours=i)).isoformat() for i in range(len(df))]

    data_points = []
    for _, row in df.iterrows():
        data_points.append(
            schemas.TelemetryDataPoint(
                timestamp=str(row["timestamp"]),
                scada_active_power_mw=float(row["scada_active_power_mw"]),
                inverter_efficiency_pct=float(row["inverter_efficiency_pct"]),
                global_horizontal_irradiance=float(row["global_horizontal_irradiance"]),
                grid_export_power_mw=float(row["grid_export_power_mw"]),
                ambient_temp_c=float(row.get("ambient_temp_c", 28.0)),
                cell_temp_c=float(row.get("cell_temp_c", 45.0)),
                wind_speed_ms=float(row.get("wind_speed_ms", 0.0))
            )
        )

    req = schemas.TelemetryIngestRequest(
        project_id=project_id,
        corporate_wallet=corporate_wallet,
        period_start=str(df["timestamp"].iloc[0]),
        period_end=str(df["timestamp"].iloc[-1]),
        vintage_year=vintage_year,
        data_points=data_points,
        satellite_irradiance_avg=satellite_irradiance_avg
    )

    return ingest_telemetry(req, db)

def _build_claim_response(claim: models.Claim, project: models.Project, batch: Optional[models.TelemetryBatch] = None) -> schemas.ClaimResponse:
    alerts = json.loads(claim.explainable_alerts_json) if claim.explainable_alerts_json else []
    ai_metrics = json.loads(claim.ai_metrics_json) if claim.ai_metrics_json else None
    
    telemetry_points = None
    if batch and batch.raw_data_json:
        try:
            raw_pts = json.loads(batch.raw_data_json)
            telemetry_points = [schemas.TelemetryDataPoint(**pt) for pt in raw_pts]
        except Exception:
            telemetry_points = None
    elif hasattr(claim, 'batch') and claim.batch and claim.batch.raw_data_json:
        try:
            raw_pts = json.loads(claim.batch.raw_data_json)
            telemetry_points = [schemas.TelemetryDataPoint(**pt) for pt in raw_pts]
        except Exception:
            telemetry_points = None

    return schemas.ClaimResponse(
        id=claim.id,
        claim_uid=claim.claim_uid,
        corporate_id=claim.corporate_id,
        corporate_wallet=claim.corporate_wallet,
        project_id=claim.project_id,
        project_name=project.name,
        project_type=project.project_type.value if hasattr(project.project_type, 'value') else str(project.project_type),
        vintage_year=claim.vintage_year,
        requested_mwh=claim.requested_mwh,
        validated_mwh=claim.validated_mwh,
        co2_offset_tonnes=claim.co2_offset_tonnes,
        risk_score=claim.risk_score,
        status=claim.status.value if hasattr(claim.status, 'value') else str(claim.status),
        explainable_alerts=alerts,
        ai_metrics=ai_metrics,
        telemetry_points=telemetry_points,
        ipfs_cid=claim.ipfs_cid,
        claim_digest=claim.claim_digest,
        oracle_signature=claim.oracle_signature,
        verifier_address=claim.verifier_address,
        verifier_notes=claim.verifier_notes,
        tx_hash=claim.tx_hash,
        created_at=claim.created_at,
        reviewed_at=claim.reviewed_at
    )
