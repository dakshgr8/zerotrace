import datetime
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    CORPORATE = "CORPORATE"
    VERIFIER = "VERIFIER"
    ADMIN = "ADMIN"

class ClaimStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    FLAGGED = "FLAGGED"
    APPROVED = "APPROVED"
    MINTED = "MINTED"
    REJECTED = "REJECTED"

class ProjectType(str, enum.Enum):
    SOLAR = "SOLAR"
    WIND = "WIND"
    HYDRO = "HYDRO"
    BIOMASS = "BIOMASS"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String(42), unique=True, index=True, nullable=False)
    organization_name = Column(String(255), nullable=False)
    compliance_registry_id = Column(String(100), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CORPORATE, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    claims = relationship("Claim", back_populates="corporate", foreign_keys="Claim.corporate_id")
    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    project_type = Column(Enum(ProjectType), default=ProjectType.SOLAR, nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    peak_capacity_mw = Column(Float, nullable=False)
    baseline_cuf = Column(Float, default=0.22) # Capacity Utilization Factor
    grid_emission_factor = Column(Float, default=0.716) # tCO2 / MWh
    methodology_hash = Column(String(66), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="projects")
    batches = relationship("TelemetryBatch", back_populates="project")
    claims = relationship("Claim", back_populates="project")

class TelemetryBatch(Base):
    __tablename__ = "telemetry_batches"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    batch_reference = Column(String(100), unique=True, index=True, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    scada_raw_mwh = Column(Float, nullable=False)
    grid_export_mwh = Column(Float, nullable=False)
    satellite_irradiance_avg = Column(Float, nullable=True)
    data_points_count = Column(Integer, default=0)
    raw_data_json = Column(Text, nullable=True)
    ingestion_hash = Column(String(66), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="batches")
    claims = relationship("Claim", back_populates="batch")

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_uid = Column(String(100), unique=True, index=True, nullable=False)
    corporate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    corporate_wallet = Column(String(42), index=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("telemetry_batches.id"), nullable=False)
    vintage_year = Column(Integer, default=2026)
    
    requested_mwh = Column(Float, nullable=False)
    validated_mwh = Column(Float, nullable=False)
    co2_offset_tonnes = Column(Float, nullable=False) # credits = validated_mwh * grid_emission_factor
    risk_score = Column(Float, default=0.0) # 0 to 100
    status = Column(Enum(ClaimStatus), default=ClaimStatus.PENDING_REVIEW, index=True)
    
    explainable_alerts_json = Column(Text, nullable=True)
    ai_metrics_json = Column(Text, nullable=True)
    
    ipfs_cid = Column(String(100), nullable=True)
    claim_digest = Column(String(66), nullable=True)
    oracle_signature = Column(String(132), nullable=True)
    verifier_address = Column(String(42), nullable=True)
    verifier_notes = Column(Text, nullable=True)
    
    tx_hash = Column(String(66), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    corporate = relationship("User", back_populates="claims", foreign_keys=[corporate_id])
    project = relationship("Project", back_populates="claims")
    batch = relationship("TelemetryBatch", back_populates="claims")

class Retirement(Base):
    __tablename__ = "retirements"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(66), unique=True, index=True, nullable=False)
    burner_wallet = Column(String(42), index=True, nullable=False)
    corporate_beneficiary = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)
    amount_tonnes = Column(Float, nullable=False)
    tx_hash = Column(String(66), nullable=False)
    block_number = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    ipfs_certificate_uri = Column(String(255), nullable=True)

class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, unique=True, index=True, nullable=False) # On-chain listing ID
    seller_wallet = Column(String(42), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    remaining_amount = Column(Float, nullable=False)
    unit_price_inr = Column(Float, default=1250.0, nullable=False)
    unit_price_eth = Column(Float, default=0.005, nullable=False)
    vintage_year = Column(Integer, default=2026)
    project_type = Column(String(100), default="Solar Utility")
    project_name = Column(String(255), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
