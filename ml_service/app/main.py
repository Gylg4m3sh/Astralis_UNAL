"""
ASTRALIS — Microservicio ML (E3)
Puerto 8001 · FastAPI + scikit-learn

Endpoints:
  GET  /health                → estado del servicio y versión del modelo
  POST /predict               → clasifica UN candidato y devuelve confianza
  POST /predict/batch         → clasifica múltiples candidatos de una vez
  GET  /model/info            → metadatos del modelo entrenado
  POST /model/retrain         → re-entrena con datos frescos de la NASA (admin)
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.model import MLModel
from app.schemas import (
    PredictRequest, PredictResponse,
    BatchPredictRequest, BatchPredictResponse,
    ModelInfo, RetrainResponse, HealthResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Instancia global del modelo
ml_model = MLModel()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Carga o entrena el modelo al arrancar el servicio."""
    logger.info("Iniciando microservicio ML de ASTRALIS...")
    ml_model.load_or_train()
    logger.info(f"Modelo listo — versión {ml_model.version}, accuracy {ml_model.metrics.get('accuracy', 0):.3f}")
    yield
    logger.info("Cerrando microservicio ML...")


app = FastAPI(
    title="ASTRALIS ML Service",
    description="Microservicio de clasificación de exoplanetas Kepler — Rol E3",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:5173", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["meta"])
async def health():
    return HealthResponse(
        status="ok",
        service="astralis-ml",
        model_loaded=ml_model.is_loaded,
        model_version=ml_model.version,
        accuracy=ml_model.metrics.get("accuracy"),
        f1_score=ml_model.metrics.get("f1_weighted"),
    )


@app.post("/predict", response_model=PredictResponse, tags=["inference"])
async def predict(request: PredictRequest):
    """
    Clasifica un candidato Kepler.
    Devuelve: classification (CONFIRMED | FALSE_POSITIVE | CANDIDATE)
    y mlConfidence (0-1).
    """
    if not ml_model.is_loaded:
        raise HTTPException(status_code=503, detail="Modelo no disponible. Intenta /model/retrain.")
    return ml_model.predict_one(request)


@app.post("/predict/batch", response_model=BatchPredictResponse, tags=["inference"])
async def predict_batch(request: BatchPredictRequest):
    """Clasifica múltiples candidatos en una sola llamada."""
    if not ml_model.is_loaded:
        raise HTTPException(status_code=503, detail="Modelo no disponible.")
    if len(request.candidates) > 500:
        raise HTTPException(status_code=422, detail="Máximo 500 candidatos por batch.")
    return ml_model.predict_batch(request)


@app.get("/model/info", response_model=ModelInfo, tags=["model"])
async def model_info():
    """Metadatos del modelo: versión, features, métricas, fecha de entrenamiento."""
    if not ml_model.is_loaded:
        raise HTTPException(status_code=503, detail="Modelo no cargado.")
    return ml_model.get_info()


@app.post("/model/retrain", response_model=RetrainResponse, tags=["model"])
async def retrain(background_tasks: BackgroundTasks):
    """
    Dispara re-entrenamiento en background con datos frescos de la NASA.
    El modelo anterior sigue activo mientras se re-entrena.
    """
    background_tasks.add_task(ml_model.retrain)
    return RetrainResponse(
        status="retraining_started",
        message="Re-entrenamiento iniciado en background. Consulta /health para ver cuando termina.",
        current_version=ml_model.version,
    )
