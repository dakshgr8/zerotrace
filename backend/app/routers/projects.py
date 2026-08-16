from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import hashlib
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    """List all registered green energy generation projects"""
    projects = db.query(models.Project).all()
    return projects

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Retrieve specific project by ID"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=schemas.ProjectResponse, status_code=201)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """Register a new renewable energy project with methodology metadata"""
    existing = db.query(models.Project).filter(models.Project.project_code == payload.project_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project code '{payload.project_code}' already exists")

    # Generate methodology hash (e.g. ACM0002 / UNFCCC AMS-I.D)
    methodology_str = f"{payload.project_code}:{payload.project_type}:{payload.peak_capacity_mw}:{payload.location}"
    methodology_hash = "0x" + hashlib.sha256(methodology_str.encode()).hexdigest()

    project = models.Project(
        project_code=payload.project_code,
        name=payload.name,
        project_type=models.ProjectType(payload.project_type),
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        peak_capacity_mw=payload.peak_capacity_mw,
        baseline_cuf=payload.baseline_cuf,
        grid_emission_factor=payload.grid_emission_factor,
        methodology_hash=methodology_hash,
        owner_id=payload.owner_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
