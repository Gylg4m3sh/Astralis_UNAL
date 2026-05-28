from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, exoplanets, iss, simulation
from app.core.database import Base, engine
from app.models import user  

# Crea las tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ASTRALIS API",
    description="Backend del Observatorio Astronómico Nacional — UNAL 2026-1S",
    version="0.1.0",
    docs_url="/docs",       # Swagger UI en http://localhost:8000/docs
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — sin esto el frontend en Vite no puede hablarle al backend
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(exoplanets.router)
app.include_router(iss.router)
app.include_router(simulation.router)


@app.get("/health", tags=["meta"])
async def health():
    """Endpoint de salud — E2 lo usa para el pipeline CI/CD."""
    return {"status": "ok", "service": "astralis-backend"}
