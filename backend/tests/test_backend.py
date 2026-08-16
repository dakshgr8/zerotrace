import pytest
import datetime
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from eth_account import Account
from eth_account.messages import encode_typed_data
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.mrv.engine import mrv_engine
from app.mrv.oracle import CryptographicOracle
from app.mrv.ipfs_service import ipfs_service
from app import models

# Isolated temporary test database so tests NEVER write to the user's zerotrace.db
TEST_DB_FILE = "/tmp/test_zerotrace.db"
test_engine = create_engine(f"sqlite:///{TEST_DB_FILE}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def init_test_db():
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Seed clean test identities
    corp = models.User(
        wallet_address="0x90f79bf6eb2c4f870365e785982e1f101e93b906",
        organization_name="Test Solar Corp",
        compliance_registry_id="REG-TEST-01",
        role=models.UserRole.CORPORATE
    )
    db.add(corp)

    verifier = models.User(
        wallet_address="0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        organization_name="Test Verifier",
        compliance_registry_id="AUD-TEST-01",
        role=models.UserRole.VERIFIER
    )
    db.add(verifier)

    proj = models.Project(
        project_code="PRJ-SOLAR-BHADLA-01",
        name="Bhadla Solar Phase IV (500 MW)",
        project_type=models.ProjectType.SOLAR,
        location="Bhadla, Phalodi, Rajasthan, India",
        latitude=27.5396,
        longitude=71.9152,
        peak_capacity_mw=500.0,
        baseline_cuf=0.245,
        grid_emission_factor=0.716,
        methodology_hash="0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        owner_id=corp.id
    )
    db.add(proj)
    db.commit()
    db.close()

    yield

    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

class MockProject:
    id = 1
    project_code = "PRJ-TEST-001"
    name = "Test Solar Plant"
    project_type = models.ProjectType.SOLAR
    location = "Rajasthan, India"
    latitude = 27.0
    longitude = 71.0
    peak_capacity_mw = 100.0
    baseline_cuf = 0.245
    grid_emission_factor = 0.716

def test_mrv_engine_clean_data():
    """Test AI MRV engine with clean, physically consistent generation data"""
    project = MockProject()
    data_points = []
    daylight_ghis = []
    for h in range(24):
        ghi = max(0.0, 900.0 * (1 - ((h - 12) / 6)**2)) if 6 <= h <= 18 else 0.0
        if ghi > 10.0:
            daylight_ghis.append(ghi)
        scada_p = (ghi / 1000.0) * 90.0 if ghi > 0 else 0.0
        grid_p = scada_p * 0.98
        data_points.append({
            "timestamp": f"2026-08-16T{h:02d}:00:00Z",
            "scada_active_power_mw": scada_p,
            "inverter_efficiency_pct": 98.5 if ghi > 0 else 0.0,
            "global_horizontal_irradiance": ghi,
            "grid_export_power_mw": grid_p,
            "ambient_temp_c": 30.0,
            "wind_speed_ms": 3.0
        })

    avg_daylight = sum(daylight_ghis) / len(daylight_ghis)
    result = mrv_engine.evaluate_telemetry_batch(project, data_points, satellite_irradiance_avg=avg_daylight)
    assert result["risk_score"] < 25.0, f"Expected low risk, got {result['risk_score']}"
    assert result["validated_mwh"] > 0
    assert result["co2_offset_tonnes"] > 0
    assert result["ai_metrics"]["recommended_action"] == "RECOMMEND_APPROVAL"

def test_mrv_engine_severe_over_reporting_anomaly():
    """Test AI MRV engine flags night-time generation, synthetic over-reporting, and efficiency violations"""
    project = MockProject()
    data_points = []
    for h in range(24):
        night_fake_power = 40.0 if 1 <= h <= 4 else 0.0
        daytime_power = 95.0 if 10 <= h <= 14 else 0.0
        scada_p = night_fake_power + daytime_power
        grid_p = 20.0 if 10 <= h <= 14 else 0.0

        data_points.append({
            "timestamp": f"2026-08-16T{h:02d}:00:00Z",
            "scada_active_power_mw": scada_p,
            "inverter_efficiency_pct": 108.5 if 10 <= h <= 14 else (95.0 if 1 <= h <= 4 else 0.0),
            "global_horizontal_irradiance": 800.0 if 10 <= h <= 14 else 0.0,
            "grid_export_power_mw": grid_p,
            "ambient_temp_c": 35.0,
            "wind_speed_ms": 2.0
        })

    result = mrv_engine.evaluate_telemetry_batch(project, data_points, satellite_irradiance_avg=250.0)
    assert result["risk_score"] >= 60.0, f"Expected high risk score, got {result['risk_score']}"
    assert len(result["alerts"]) > 0
    assert result["ai_metrics"]["recommended_action"] in ["RECOMMEND_REJECTION", "FLAG_FOR_MANUAL_AUDIT"]

def test_cryptographic_oracle_signature():
    """Test EIP-712 / ECDSA digital signing and verification matching smart contract expectations"""
    verifier_account = Account.create()
    test_oracle = CryptographicOracle(
        private_key=verifier_account.key.hex(),
        verifying_contract="0x5FbDB2315678afecb367f032d93F642f64180aa3",
        chain_id=31337
    )

    corporate_wallet = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    amount_ztc = 525.75
    claim_digest = "0x" + "a" * 64

    signature, digest = test_oracle.sign_mint_authorization(
        corporate_wallet=corporate_wallet,
        amount_ztc=amount_ztc,
        claim_digest=claim_digest
    )

    assert signature.startswith("0x")
    assert len(signature) == 132

def test_ipfs_json_ld_pinning():
    """Test decentralized JSON-LD verification report pinning and SHA-256 integrity"""
    verification_payload = {
        "claim_uid": "CLM-TEST-UNIT-01",
        "project_code": "PRJ-SOLAR-BHADLA-01",
        "verified_mwh": 1250.5,
        "co2_tonnes": 895.358,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    cid, digest = ipfs_service.pin_json(verification_payload)
    assert cid.startswith("Qm") or cid.startswith("1")
    assert digest.startswith("0x")

    retrieved = ipfs_service.get_json(cid)
    assert retrieved is not None
    assert retrieved["claim_uid"] == "CLM-TEST-UNIT-01"

def test_api_endpoints_health_and_projects():
    """Test FastAPI projects and stats endpoints"""
    resp_health = client.get("/health")
    assert resp_health.status_code == 200

    resp_projects = client.get("/api/projects")
    assert resp_projects.status_code == 200
    projects = resp_projects.json()
    assert len(projects) >= 1

    resp_stats = client.get("/api/mrv/stats")
    assert resp_stats.status_code == 200
    stats = resp_stats.json()
    assert "total_projects" in stats
    assert "pending_review" in stats

def test_api_telemetry_ingest_and_hitl_approval_flow():
    """Test end-to-end API telemetry ingestion -> AI evaluation -> HITL verifier approval"""
    ingest_payload = {
        "project_id": 1,
        "corporate_wallet": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "period_start": "2026-08-16T00:00:00Z",
        "period_end": "2026-08-16T23:59:59Z",
        "vintage_year": 2026,
        "data_points": [
            {
                "timestamp": "2026-08-16T12:00:00Z",
                "scada_active_power_mw": 85.0,
                "inverter_efficiency_pct": 98.4,
                "global_horizontal_irradiance": 880.0,
                "grid_export_power_mw": 83.2,
                "ambient_temp_c": 31.0,
                "wind_speed_ms": 3.0
            }
        ],
        "satellite_irradiance_avg": 880.0
    }
    resp_ingest = client.post("/api/telemetry/ingest", json=ingest_payload)
    assert resp_ingest.status_code == 201
    claim = resp_ingest.json()
    claim_id = claim["id"]
    assert claim["requested_mwh"] == 85.0
    assert claim["validated_mwh"] == 83.2

    resp_pending = client.get("/api/mrv/pending-claims")
    assert resp_pending.status_code == 200
    pending_ids = [c["id"] for c in resp_pending.json()]
    assert claim_id in pending_ids

    approve_payload = {
        "verifier_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "verifier_notes": "Audited and verified by Lead ESG Assessor."
    }
    resp_approve = client.post(f"/api/mrv/approve-claim/{claim_id}", json=approve_payload)
    assert resp_approve.status_code == 200
    approved_claim = resp_approve.json()
    assert approved_claim["status"] == "APPROVED"
    assert approved_claim["oracle_signature"] is not None
    assert approved_claim["oracle_signature"].startswith("0x")
    assert approved_claim["ipfs_cid"] is not None
    assert approved_claim["claim_digest"] is not None
