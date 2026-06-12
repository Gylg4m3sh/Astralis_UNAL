"""
Cliente HTTP del microservicio ML de ASTRALIS (E3).

El backend (E1) usa este cliente para:
  - Enriquecer los exoplanetas del catálogo con la clasificación y la
    confianza calculadas por el modelo Random Forest entrenado por E3.
  - Exponer un endpoint propio (/api/exoplanets/predict) que delega
    la inferencia al microservicio ML.
  - Reportar en /health si el microservicio ML está disponible.

Si el microservicio ML no responde (apagado, en mantenimiento, etc.) todas
las funciones devuelven `None` o `False` y el backend sigue funcionando con
los datos crudos del NASA Exoplanet Archive (degradación elegante).
"""
from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# URL del microservicio ML — configurable vía variable de entorno ML_SERVICE_URL.
# En docker-compose apunta al servicio interno "ml" (http://ml:8001).
ML_BASE = settings.ML_SERVICE_URL.rstrip("/")

_TIMEOUT = httpx.Timeout(5.0, connect=3.0)


# Features que el modelo de E3 espera (ver ml_service/app/schemas.py).
ML_FEATURE_KEYS = [
    "koi_period", "koi_prad", "koi_teq", "koi_insol",
    "koi_steff", "koi_slogg", "koi_srad", "koi_smass",
    "koi_duration", "koi_depth", "koi_impact", "koi_incl",
]


def exoplanet_to_ml_features(exoplanet: dict[str, Any]) -> dict[str, Optional[float]]:
    """
    Traduce un registro del catálogo (formato `Exoplanet` de E1, derivado del
    NASA Exoplanet Archive) al payload `ExoplanetFeatures` que espera el
    microservicio ML.

    El catálogo del backend solo conserva 3 de las 12 features del modelo
    (orbitalPeriod, planetRadius, equilibriumTemp); el resto se deja en
    `None` y el microservicio ML las imputa con la mediana del set de
    entrenamiento, tal y como lo describe su propio README.
    """
    return {
        "koi_period": exoplanet.get("orbitalPeriod"),
        "koi_prad": exoplanet.get("planetRadius"),
        "koi_teq": exoplanet.get("equilibriumTemp"),
        "koi_insol": None,
        "koi_steff": None,
        "koi_slogg": None,
        "koi_srad": None,
        "koi_smass": None,
        "koi_duration": None,
        "koi_depth": None,
        "koi_impact": None,
        "koi_incl": None,
    }


async def predict_exoplanet(features: dict[str, Any]) -> Optional[dict[str, Any]]:
    """
    Llama a `POST /predict` del microservicio ML.

    `features` debe ser un dict con (algunas o todas) las claves de
    ML_FEATURE_KEYS. Las claves ausentes o con valor None son imputadas
    por el microservicio con las medianas del set de entrenamiento.

    Devuelve un dict con classification, mlConfidence, probConfirmed,
    probFalsePos, probCandidate, model_version y features_used, o `None`
    si el microservicio no está disponible.
    """
    payload = {k: features.get(k) for k in ML_FEATURE_KEYS if features.get(k) is not None}
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.post(f"{ML_BASE}/predict", json=payload)
            r.raise_for_status()
            data = r.json()
            return {
                "classification": data["classification"],
                "mlConfidence": data["mlConfidence"],
                "probConfirmed": data.get("probConfirmed"),
                "probFalsePos": data.get("probFalsePos"),
                "probCandidate": data.get("probCandidate"),
                "model_version": data.get("model_version"),
                "features_used": data.get("features_used"),
            }
    except Exception as e:
        logger.warning(f"ML service no disponible ({ML_BASE}): {e}. Usando datos del CSV de NASA.")
        return None


async def predict_batch(candidates: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """Llama a `POST /predict/batch` para clasificar varios candidatos a la vez."""
    payload = {
        "candidates": [
            {k: c.get(k) for k in ML_FEATURE_KEYS if c.get(k) is not None}
            for c in candidates
        ]
    }
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.post(f"{ML_BASE}/predict/batch", json=payload)
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.warning(f"ML service no disponible ({ML_BASE}): {e}.")
        return None


async def get_model_info() -> Optional[dict[str, Any]]:
    """Llama a `GET /model/info` — versión, métricas y feature importances del modelo."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.get(f"{ML_BASE}/model/info")
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.warning(f"ML service no disponible ({ML_BASE}): {e}.")
        return None


async def trigger_retrain() -> Optional[dict[str, Any]]:
    """Llama a `POST /model/retrain` para iniciar un re-entrenamiento en background."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.post(f"{ML_BASE}/model/retrain")
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.warning(f"ML service no disponible ({ML_BASE}): {e}.")
        return None


async def ml_service_healthy() -> dict[str, Any]:
    """
    Verifica si el microservicio ML está activo y devuelve su estado completo.
    Usado por el endpoint /health del backend para reportar la salud de E3.
    """
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.get(f"{ML_BASE}/health")
            r.raise_for_status()
            data = r.json()
            return {
                "available": True,
                "model_loaded": data.get("model_loaded", False),
                "model_version": data.get("model_version"),
                "accuracy": data.get("accuracy"),
                "f1_score": data.get("f1_score"),
            }
    except Exception as e:
        logger.warning(f"ML service no disponible ({ML_BASE}): {e}.")
        return {"available": False, "model_loaded": False, "model_version": None,
                "accuracy": None, "f1_score": None}
