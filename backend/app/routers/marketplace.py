from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/marketplace", tags=["Carbon Marketplace"])

@router.get("/listings", response_model=List[schemas.MarketplaceListingResponse])
def get_listings(
    active_only: bool = True,
    project_type: Optional[str] = None,
    vintage_year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieve real-time marketplace order book and active listings"""
    query = db.query(models.MarketplaceListing)
    if active_only:
        query = query.filter(models.MarketplaceListing.active == True, models.MarketplaceListing.remaining_amount > 0)
    if project_type:
        query = query.filter(models.MarketplaceListing.project_type.ilike(f"%{project_type}%"))
    if vintage_year:
        query = query.filter(models.MarketplaceListing.vintage_year == vintage_year)

    return query.order_by(models.MarketplaceListing.created_at.desc()).all()

@router.post("/sync-listing", response_model=schemas.MarketplaceListingResponse, status_code=201)
def sync_onchain_listing(payload: schemas.MarketplaceListingCreate, db: Session = Depends(get_db)):
    """Sync newly created smart contract listing to database index"""
    existing = db.query(models.MarketplaceListing).filter(models.MarketplaceListing.listing_id == payload.listing_id).first()
    if existing:
        existing.amount = payload.amount
        existing.remaining_amount = payload.remaining_amount
        existing.unit_price_inr = payload.unit_price_inr
        existing.unit_price_eth = payload.unit_price_eth or 0.005
        existing.active = payload.remaining_amount > 0
        db.commit()
        db.refresh(existing)
        return existing

    listing = models.MarketplaceListing(
        listing_id=payload.listing_id,
        seller_wallet=payload.seller_wallet.lower(),
        amount=payload.amount,
        remaining_amount=payload.remaining_amount,
        unit_price_inr=payload.unit_price_inr,
        unit_price_eth=payload.unit_price_eth or 0.005,
        vintage_year=payload.vintage_year,
        project_type=payload.project_type,
        project_name=payload.project_name,
        active=True
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing

@router.post("/sync-purchase/{listing_id}")
def sync_purchase(listing_id: int, amount: float, db: Session = Depends(get_db)):
    """Sync partial or full on-chain purchase to update remaining supply"""
    listing = db.query(models.MarketplaceListing).filter(models.MarketplaceListing.listing_id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.remaining_amount = max(0.0, listing.remaining_amount - amount)
    if listing.remaining_amount == 0.0:
        listing.active = False
    db.commit()
    return {"status": "success", "remaining_amount": listing.remaining_amount, "active": listing.active}

@router.post("/sync-cancel/{listing_id}")
def sync_cancel(listing_id: int, db: Session = Depends(get_db)):
    """Sync listing cancellation"""
    listing = db.query(models.MarketplaceListing).filter(models.MarketplaceListing.listing_id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.active = False
    listing.remaining_amount = 0.0
    db.commit()
    return {"status": "cancelled", "listing_id": listing_id}
