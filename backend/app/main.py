from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import Base, engine
from app.routers import projects, telemetry, mrv, marketplace, retirements
from app.seed import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zerotrace")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ZeroTrace backend services and database schema...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    logger.info("ZeroTrace backend shutdown.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Blockchain Carbon Credit & AI-MRV Verification Platform API",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(projects.router, prefix=settings.API_V1_PREFIX)
app.include_router(telemetry.router, prefix=settings.API_V1_PREFIX)
app.include_router(mrv.router, prefix=settings.API_V1_PREFIX)
app.include_router(marketplace.router, prefix=settings.API_V1_PREFIX)
app.include_router(retirements.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "oracle_address": settings.ORACLE_ADDRESS
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )
