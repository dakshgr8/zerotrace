from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import datetime

from app.database import get_db
from app import models, schemas
from app.mrv.ipfs_service import ipfs_service
from app.mrv.oracle import oracle_service
from app.routers.telemetry import _build_claim_response

router = APIRouter(prefix="/mrv", tags=["AI-MRV & Cryptographic Oracle"])

@router.get("/pending-claims", response_model=List[schemas.ClaimResponse])
def get_pending_claims(db: Session = Depends(get_db)):
    """Retrieve all claims awaiting Auditor review & signature"""
    claims = db.query(models.Claim).filter(
        models.Claim.status.in_([models.ClaimStatus.PENDING_REVIEW, models.ClaimStatus.FLAGGED])
    ).order_by(models.Claim.created_at.desc()).all()

    results = []
    for c in claims:
        project = db.query(models.Project).filter(models.Project.id == c.project_id).first()
        batch = db.query(models.TelemetryBatch).filter(models.TelemetryBatch.id == c.batch_id).first()
        results.append(_build_claim_response(c, project, batch))
    return results

@router.get("/claims", response_model=List[schemas.ClaimResponse])
def get_all_claims(
    corporate_wallet: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all claims with optional wallet and status filtering"""
    query = db.query(models.Claim)
    if corporate_wallet:
        query = query.filter(models.Claim.corporate_wallet == corporate_wallet.lower())
    if status:
        query = query.filter(models.Claim.status == models.ClaimStatus(status))

    claims = query.order_by(models.Claim.created_at.desc()).all()
    results = []
    for c in claims:
        project = db.query(models.Project).filter(models.Project.id == c.project_id).first()
        batch = db.query(models.TelemetryBatch).filter(models.TelemetryBatch.id == c.batch_id).first()
        results.append(_build_claim_response(c, project, batch))
    return results

@router.get("/claims/{claim_id}", response_model=schemas.ClaimResponse)
def get_claim_details(claim_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed single claim with raw telemetry and AI breakdown"""
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    project = db.query(models.Project).filter(models.Project.id == claim.project_id).first()
    batch = db.query(models.TelemetryBatch).filter(models.TelemetryBatch.id == claim.batch_id).first()
    return _build_claim_response(claim, project, batch)

@router.post("/approve-claim/{claim_id}", response_model=schemas.ClaimResponse)
def approve_claim(
    claim_id: int,
    payload: schemas.ClaimApproveRequest,
    db: Session = Depends(get_db)
):
    """
    Human-in-the-Loop (HITL) Verifier approval workflow:
    1. Generates auditable W3C JSON-LD MRV compliance report.
    2. Pins to decentralized IPFS storage, obtaining CID and Keccak256 claimDigest.
    3. Cryptographically signs an EIP-712 authorization signature using Oracle private key.
    4. Authorizes Corporate to execute zero-cost `mintWithVerification` on-chain.
    """
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in [models.ClaimStatus.PENDING_REVIEW, models.ClaimStatus.FLAGGED]:
        raise HTTPException(status_code=400, detail=f"Cannot approve claim in '{claim.status}' state")

    project = db.query(models.Project).filter(models.Project.id == claim.project_id).first()
    batch = db.query(models.TelemetryBatch).filter(models.TelemetryBatch.id == claim.batch_id).first()

    alerts = json.loads(claim.explainable_alerts_json) if claim.explainable_alerts_json else []
    ai_metrics = json.loads(claim.ai_metrics_json) if claim.ai_metrics_json else {}

    # 1. Generate JSON-LD report
    json_ld = ipfs_service.generate_mrv_json_ld(
        claim_uid=claim.claim_uid,
        corporate_wallet=claim.corporate_wallet,
        project=project,
        batch=batch,
        validated_mwh=claim.validated_mwh,
        co2_offset_tonnes=claim.co2_offset_tonnes,
        risk_score=claim.risk_score,
        verifier_address=payload.verifier_address,
        alerts=alerts,
        ai_metrics=ai_metrics
    )

    # 2. Pin to IPFS
    cid, claim_digest = ipfs_service.pin_json(json_ld)

    # 3. Sign EIP-712 authorization using Oracle private key
    oracle_sig, _ = oracle_service.sign_mint_authorization(
        corporate_wallet=claim.corporate_wallet,
        amount_ztc=claim.co2_offset_tonnes,
        claim_digest=claim_digest
    )

    # 4. Update Claim state in database
    claim.status = models.ClaimStatus.APPROVED
    claim.ipfs_cid = cid
    claim.claim_digest = claim_digest
    claim.oracle_signature = oracle_sig
    claim.verifier_address = payload.verifier_address.lower()
    claim.verifier_notes = payload.verifier_notes
    claim.reviewed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(claim)

    return _build_claim_response(claim, project, batch)

@router.post("/reject-claim/{claim_id}", response_model=schemas.ClaimResponse)
def reject_claim(
    claim_id: int,
    payload: schemas.ClaimRejectRequest,
    db: Session = Depends(get_db)
):
    """Reject fraudulent, anomalous, or unverified claims"""
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    project = db.query(models.Project).filter(models.Project.id == claim.project_id).first()
    batch = db.query(models.TelemetryBatch).filter(models.TelemetryBatch.id == claim.batch_id).first()

    claim.status = models.ClaimStatus.REJECTED
    claim.verifier_address = payload.verifier_address.lower()
    claim.verifier_notes = f"REJECTED: {payload.reason}"
    claim.reviewed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(claim)

    return _build_claim_response(claim, project, batch)

@router.post("/confirm-mint/{claim_id}", response_model=schemas.ClaimResponse)
def confirm_mint(
    claim_id: int,
    payload: schemas.ClaimMintConfirmRequest,
    db: Session = Depends(get_db)
):
    """Confirm on-chain execution of `mintWithVerification` by recording the transaction hash"""
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    project = db.query(models.Project).filter(models.Project.id == claim.project_id).first()
    batch = db.query(models.TelemetryBatch).filter(models.TelemetryBatch.id == claim.batch_id).first()

    claim.status = models.ClaimStatus.MINTED
    claim.tx_hash = payload.tx_hash
    db.commit()
    db.refresh(claim)

    return _build_claim_response(claim, project, batch)

@router.get("/ipfs/{cid}")
def get_ipfs_report(cid: str):
    """Fetch decentralized JSON-LD MRV compliance packet by IPFS CID"""
    report = ipfs_service.get_json(cid)
    if not report:
        raise HTTPException(status_code=404, detail="IPFS document not found")
    return report

@router.get("/stats")
def get_global_stats(db: Session = Depends(get_db)):
    """Retrieve platform aggregate statistics for dashboards"""
    total_projects = db.query(models.Project).count()
    total_claims = db.query(models.Claim).count()
    pending_claims = db.query(models.Claim).filter(
        models.Claim.status.in_([models.ClaimStatus.PENDING_REVIEW, models.ClaimStatus.FLAGGED])
    ).count()
    approved_claims = db.query(models.Claim).filter(models.Claim.status == models.ClaimStatus.APPROVED).count()
    minted_claims = db.query(models.Claim).filter(models.Claim.status == models.ClaimStatus.MINTED).count()

    total_validated_mwh = sum([c.validated_mwh for c in db.query(models.Claim).all()])
    total_offset_tonnes = sum([c.co2_offset_tonnes for c in db.query(models.Claim).filter(models.Claim.status == models.ClaimStatus.MINTED).all()])
    total_retired_tonnes = sum([r.amount_tonnes for r in db.query(models.Retirement).all()])

    return {
        "total_projects": total_projects,
        "total_claims": total_claims,
        "pending_review": pending_claims,
        "approved_claims": approved_claims,
        "minted_claims": minted_claims,
        "total_validated_mwh": round(total_validated_mwh, 2),
        "total_carbon_credits_minted_ztc": round(total_offset_tonnes, 2),
        "total_retired_offset_tonnes": round(total_retired_tonnes, 2),
        "oracle_address": oracle_service.get_oracle_address()
    }
