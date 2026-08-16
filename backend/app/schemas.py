from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime

class UserBase(BaseModel):
    wallet_address: str
    organization_name: str
    compliance_registry_id: Optional[str] = None
    role: str = "CORPORATE"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ProjectBase(BaseModel):
    project_code: str
    name: str
    project_type: str = "SOLAR"
    location: str
    latitude: float
    longitude: float
    peak_capacity_mw: float
    baseline_cuf: float = 0.22
    grid_emission_factor: float = 0.716

class ProjectCreate(ProjectBase):
    owner_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    methodology_hash: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Telemetry point data schema
class TelemetryDataPoint(BaseModel):
    timestamp: str
    scada_active_power_mw: float
    inverter_efficiency_pct: float
    global_horizontal_irradiance: float # W/m2
    grid_export_power_mw: float
    ambient_temp_c: Optional[float] = 25.0
    wind_speed_ms: Optional[float] = 3.5

class TelemetryIngestRequest(BaseModel):
    project_id: int
    corporate_wallet: str
    period_start: str
    period_end: str
    vintage_year: int = 2026
    data_points: List[TelemetryDataPoint]
    satellite_irradiance_avg: Optional[float] = None
    comments: Optional[str] = None

class ExplainableAlert(BaseModel):
    severity: str # LOW, MEDIUM, HIGH, CRITICAL
    category: str # DISPARITY, SATELLITE_DEVIATION, BASELINE_ANOMALY, INVERTER_DEGRADATION, NIGHT_GENERATION
    title: str
    description: str
    impact_mwh: float = 0.0

class AIMetrics(BaseModel):
    scada_total_mwh: float
    grid_export_total_mwh: float
    disparity_pct: float
    capacity_utilization_factor: float
    baseline_expected_cuf: float
    satellite_correlation_score: float
    isolation_forest_anomaly_ratio: float
    recommended_action: str

class ClaimResponse(BaseModel):
    id: int
    claim_uid: str
    corporate_id: int
    corporate_wallet: str
    project_id: int
    project_name: Optional[str] = None
    project_type: Optional[str] = None
    vintage_year: int
    requested_mwh: float
    validated_mwh: float
    co2_offset_tonnes: float
    risk_score: float
    status: str
    explainable_alerts: List[ExplainableAlert] = []
    ai_metrics: Optional[AIMetrics] = None
    telemetry_points: Optional[List[TelemetryDataPoint]] = None
    ipfs_cid: Optional[str] = None
    claim_digest: Optional[str] = None
    oracle_signature: Optional[str] = None
    verifier_address: Optional[str] = None
    verifier_notes: Optional[str] = None
    tx_hash: Optional[str] = None
    created_at: datetime.datetime
    reviewed_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ClaimApproveRequest(BaseModel):
    verifier_address: str
    verifier_notes: Optional[str] = "Verified against multi-source telemetry and CEA regional baseline models."
    override_risk: Optional[bool] = False

class ClaimRejectRequest(BaseModel):
    verifier_address: str
    reason: str

class ClaimMintConfirmRequest(BaseModel):
    tx_hash: str

class RetirementCreate(BaseModel):
    certificate_id: str
    burner_wallet: str
    corporate_beneficiary: str
    reason: Optional[str] = "Scope 1 & 2 Neutralization"
    amount_tonnes: float
    tx_hash: str
    block_number: Optional[int] = None
    ipfs_certificate_uri: Optional[str] = None

class RetirementResponse(BaseModel):
    id: int
    certificate_id: str
    burner_wallet: str
    corporate_beneficiary: str
    reason: Optional[str] = None
    amount_tonnes: float
    tx_hash: str
    block_number: Optional[int] = None
    timestamp: datetime.datetime
    ipfs_certificate_uri: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MarketplaceListingCreate(BaseModel):
    listing_id: int
    seller_wallet: str
    amount: float
    remaining_amount: float
    unit_price_inr: float = 1250.0
    unit_price_eth: Optional[float] = 0.005
    vintage_year: int = 2026
    project_type: str = "Solar Utility"
    project_name: Optional[str] = "Bhadla Solar Park"

class MarketplaceListingResponse(BaseModel):
    id: int
    listing_id: int
    seller_wallet: str
    amount: float
    remaining_amount: float
    unit_price_inr: float = 1250.0
    unit_price_eth: Optional[float] = 0.005
    vintage_year: int
    project_type: str
    project_name: Optional[str] = None
    active: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
