from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.user import User
from app.core.security import hash_password
from app.routers import auth, exoplanets, iss, simulation
import uuid

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

Base.metadata.create_all(bind=engine)

# Semillar usuario demo si no existe
db = SessionLocal()
try:
    demo_user = db.query(User).filter(User.email == "demo@unal.edu.co").first()
    if not demo_user:
        user = User(
            id=str(uuid.uuid4()),
            username="demo",
            email="demo@unal.edu.co",
            hashed_password=hash_password("demo1234"),
        )
        db.add(user)
        db.commit()
except Exception as e:
    print(f"Error seeding demo user: {e}")
finally:
    db.close()

app = FastAPI(
    title="ASTRALIS API",
    description="Backend del Observatorio Astronómico Nacional — UNAL 2026-1S",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# Routers
app.include_router(auth.router)
app.include_router(exoplanets.router)
app.include_router(iss.router)
app.include_router(simulation.router)

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "service": "astralis-backend"}
