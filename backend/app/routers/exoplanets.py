import math
import random
from fastapi import APIRouter, HTTPException, Query
from app.services.nasa import get_exoplanets, get_exoplanet_by_id
from app.services import ml_client
from app.schemas.index import PaginatedResponse, Exoplanet, MLFeatures, MLPrediction
from pydantic import BaseModel

router = APIRouter(prefix="/api/exoplanets", tags=["exoplanets"])


class LightCurvePoint(BaseModel):
    time: float       # horas relativas al centro del tránsito
    flux: float       # flujo normalizado (1.0 = sin tránsito)
    fluxNoise: float  # con ruido realista


def _transit_depth(planet_radius: float) -> float:
    ratio = planet_radius * 0.009167  # radios terrestres → radios solares
    return min(ratio * ratio, 0.05)


def _transit_shape(t: float, duration: float, depth: float) -> float:
    half_d = duration / 2
    ingress = duration * 0.15
    if abs(t) > half_d:
        return 1.0
    if abs(t) > half_d - ingress:
        phase = (half_d - abs(t)) / ingress
        return 1.0 - depth * math.sin((phase * math.pi) / 2) ** 2
    return 1.0 - depth


def _generate_light_curve(planet_radius: float, orbital_period: float) -> list[dict]:
    depth = _transit_depth(planet_radius)
    duration = min(orbital_period * 0.01, 8)
    noise_level = 0.0008 + random.random() * 0.0004
    total_time = duration * 4
    steps = 200
    points = []
    for i in range(steps + 1):
        t = -total_time / 2 + (i / steps) * total_time
        flux = _transit_shape(t, duration, depth)
        noise = (random.random() - 0.5) * 2 * noise_level
        points.append({
            "time": round(t, 3),
            "flux": round(flux, 6),
            "fluxNoise": round(flux + noise, 6),
        })
    return points


def _exoplanet_to_ml_features(exoplanet: dict) -> dict:
    """Mapea un registro del catálogo a las features que espera el modelo de E3."""
    return {
        "koi_period": exoplanet.get("orbitalPeriod"),
        "koi_prad": exoplanet.get("planetRadius"),
        "koi_teq": exoplanet.get("equilibriumTemp"),
    }


@router.get("", response_model=PaginatedResponse[Exoplanet])
async def list_exoplanets(
    page: int = Query(1, ge=1),
    filter: str | None = Query(None, description="CONFIRMED | FALSE_POSITIVE | CANDIDATE"),
    pageSize: int = Query(10, ge=1, le=100),
):
    return get_exoplanets(page=page, page_size=pageSize, filter_classification=filter)


@router.post("/predict", response_model=MLPrediction, tags=["machine-learning"])
async def predict_candidate(features: MLFeatures):
    """
    Clasifica un candidato a exoplaneta usando el modelo Random Forest del
    microservicio ML (E3). Recibe las 12 features Kepler (todas opcionales,
    se imputan con la mediana del set de entrenamiento si faltan) y
    devuelve `classification` + `mlConfidence` + probabilidades por clase.
    """
    result = await ml_client.predict_exoplanet(features.model_dump())
    if result is None:
        raise HTTPException(
            status_code=503,
            detail="Microservicio ML (E3) no disponible. Intenta de nuevo más tarde.",
        )
    return result


@router.get("/ml/model-info", tags=["machine-learning"])
async def ml_model_info():
    """Proxy a `GET /model/info` del microservicio ML — versión, métricas y feature importances."""
    info = await ml_client.get_model_info()
    if info is None:
        raise HTTPException(status_code=503, detail="Microservicio ML (E3) no disponible.")
    return info


@router.post("/ml/retrain", tags=["machine-learning"])
async def ml_retrain():
    """Proxy a `POST /model/retrain` del microservicio ML — dispara re-entrenamiento en background."""
    result = await ml_client.trigger_retrain()
    if result is None:
        raise HTTPException(status_code=503, detail="Microservicio ML (E3) no disponible.")
    return result


@router.get("/{exoplanet_id}/ml-prediction", response_model=MLPrediction, tags=["machine-learning"])
async def get_exoplanet_ml_prediction(exoplanet_id: str):
    """
    Clasifica un exoplaneta del catálogo usando el modelo de E3, a partir de
    sus features disponibles (período orbital, radio y temperatura de
    equilibrio). El resto de features se imputan con la mediana del set de
    entrenamiento.
    """
    exoplanet = get_exoplanet_by_id(exoplanet_id)
    if not exoplanet:
        raise HTTPException(status_code=404, detail=f"Exoplaneta {exoplanet_id} no encontrado")

    features = _exoplanet_to_ml_features(exoplanet)
    result = await ml_client.predict_exoplanet(features)
    if result is None:
        raise HTTPException(
            status_code=503,
            detail="Microservicio ML (E3) no disponible. Intenta de nuevo más tarde.",
        )
    return result


@router.get("/{exoplanet_id}/lightcurve", response_model=list[LightCurvePoint])
async def get_light_curve(exoplanet_id: str):
    exoplanet = get_exoplanet_by_id(exoplanet_id)
    if not exoplanet:
        raise HTTPException(status_code=404, detail=f"Exoplaneta {exoplanet_id} no encontrado")
    return _generate_light_curve(exoplanet["planetRadius"], exoplanet["orbitalPeriod"])


@router.get("/{exoplanet_id}", response_model=Exoplanet)
async def get_exoplanet(exoplanet_id: str):
    exoplanet = get_exoplanet_by_id(exoplanet_id)
    if not exoplanet:
        raise HTTPException(status_code=404, detail=f"Exoplaneta {exoplanet_id} no encontrado")
    return exoplanet
