from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app import models

def seed_database():
    print("🌱 Initializing ZeroTrace clean catalog & user registry...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if projects already registered
    if db.query(models.Project).count() > 0:
        print("Database projects already initialized.")
        db.close()
        return

    # 1. Register Platform Identities
    corporate_user = models.User(
        wallet_address="0x90f79bf6eb2c4f870365e785982e1f101e93b906", # Hardhat Account #3
        organization_name="Tata Power Renewable Energy Ltd",
        compliance_registry_id="REG-CEA-IN-2026-8819",
        role=models.UserRole.CORPORATE
    )
    db.add(corporate_user)

    verifier_user = models.User(
        wallet_address="0x70997970c51812dc3a010c7d01b50e0d17dc79c8", # Hardhat Account #1 (Oracle Signer)
        organization_name="Bureau Veritas / SGS Government MRV Assurance",
        compliance_registry_id="AUD-VCS-VERA-004",
        role=models.UserRole.VERIFIER
    )
    db.add(verifier_user)

    buyer_user = models.User(
        wallet_address="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", # Hardhat Account #2
        organization_name="Corporate ESG Sustainability Fund",
        compliance_registry_id="BUY-ESG-2026-102",
        role=models.UserRole.CORPORATE
    )
    db.add(buyer_user)
    db.commit()
    db.refresh(corporate_user)

    # 2. Register Clean Renewable Energy Generation Assets (100% Solar PV Assets)
    project1 = models.Project(
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
        owner_id=corporate_user.id
    )
    db.add(project1)

    project2 = models.Project(
        project_code="PRJ-SOLAR-REWA-02",
        name="Rewa Ultra Mega Solar Park (250 MW)",
        project_type=models.ProjectType.SOLAR,
        location="Gurh, Rewa, Madhya Pradesh, India",
        latitude=24.4842,
        longitude=81.3039,
        peak_capacity_mw=250.0,
        baseline_cuf=0.228,
        grid_emission_factor=0.742,
        methodology_hash="0x9c34a2e56b829c3a6bc891f165a882a1728bb84128f117c37b30a5da4c643b2f",
        owner_id=corporate_user.id
    )
    db.add(project2)

    project3 = models.Project(
        project_code="PRJ-SOLAR-PAVAGADA-03",
        name="Pavagada Ultra Mega Solar Park (300 MW)",
        project_type=models.ProjectType.SOLAR,
        location="Tumkur, Karnataka, India",
        latitude=14.1018,
        longitude=77.2798,
        peak_capacity_mw=300.0,
        baseline_cuf=0.215,
        grid_emission_factor=0.684,
        methodology_hash="0x3b89c7d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234",
        owner_id=corporate_user.id
    )
    db.add(project3)
    db.commit()

    print("✅ Clean projects and users initialized. Zero mock claims/batches/listings created.")
    db.close()

if __name__ == "__main__":
    seed_database()
