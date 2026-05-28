from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, exoplanets, science

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Astralis API",
    description="API REST para simulación orbital y exoplanetas (Fase 2)",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exoplanets.router)
app.include_router(science.router)

@app.get("/")
@limiter.limit("10/minute")
def index(request: Request):
    return {
        "status": "ok",
        "api": "Astralis Backend",
        "msg": "API de backend corriendo"
    }

@app.get("/health")
def health():
    return {"status": "ok"}
