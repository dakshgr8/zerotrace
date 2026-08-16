from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/retirements", tags=["Offset Retirements & Certificates"])

@router.get("", response_model=List[schemas.RetirementResponse])
def get_retirements(
    burner_wallet: Optional[str] = None,
    corporate_beneficiary: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all permanent carbon offset retirements with cryptographic proof"""
    query = db.query(models.Retirement)
    if burner_wallet:
        query = query.filter(models.Retirement.burner_wallet == burner_wallet.lower())
    if corporate_beneficiary:
        query = query.filter(models.Retirement.corporate_beneficiary.ilike(f"%{corporate_beneficiary}%"))

    return query.order_by(models.Retirement.timestamp.desc()).all()

@router.get("/certificate/{certificate_id}", response_model=schemas.RetirementResponse)
def get_certificate_by_id(certificate_id: str, db: Session = Depends(get_db)):
    """Retrieve verified retirement certificate data by its unique on-chain certificateId"""
    ret = db.query(models.Retirement).filter(models.Retirement.certificate_id == certificate_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Retirement certificate not found")
    return ret

@router.post("/record", response_model=schemas.RetirementResponse, status_code=201)
def record_retirement(payload: schemas.RetirementCreate, db: Session = Depends(get_db)):
    """Record on-chain `burnForOffset` execution into database registry"""
    existing = db.query(models.Retirement).filter(models.Retirement.certificate_id == payload.certificate_id).first()
    if existing:
        return existing

    retirement = models.Retirement(
        certificate_id=payload.certificate_id,
        burner_wallet=payload.burner_wallet.lower(),
        corporate_beneficiary=payload.corporate_beneficiary,
        reason=payload.reason or "Scope 1 & 2 Neutralization",
        amount_tonnes=payload.amount_tonnes,
        tx_hash=payload.tx_hash,
        block_number=payload.block_number,
        ipfs_certificate_uri=payload.ipfs_certificate_uri
    )
    db.add(retirement)
    db.commit()
    db.refresh(retirement)
    return retirement
