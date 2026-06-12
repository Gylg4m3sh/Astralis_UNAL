"""
Schemas Pydantic del microservicio ML.
El campo mlConfidence y classification deben coincidir
con los tipos del backend E1 (app/schemas/index.py).
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ─── Input ────────────────────────────────────────────────────────────────────

class ExoplanetFeatures(BaseModel):
    """
    Features astronómicas del candidato Kepler.
    Todas vienen del NASA Exoplanet Archive.
    Valores None serán imputados con la mediana del dataset de entrenamiento.
    """
    koi_period:   Optional[float] = Field(None, description="Período orbital (días)")
    koi_prad:     Optional[float] = Field(None, description="Radio del planeta (R⊕)")
    koi_teq:      Optional[float] = Field(None, description="Temperatura de equilibrio (K)")
    koi_insol:    Optional[float] = Field(None, description="Flujo de insolación (F⊕)")
    koi_steff:    Optional[float] = Field(None, description="Temperatura efectiva de la estrella (K)")
    koi_slogg:    Optional[float] = Field(None, description="Gravedad superficial estelar (log g)")
    koi_srad:     Optional[float] = Field(None, description="Radio estelar (R☉)")
    koi_smass:    Optional[float] = Field(None, description="Masa estelar (M☉)")
    koi_duration: Optional[float] = Field(None, description="Duración del tránsito (horas)")
    koi_depth:    Optional[float] = Field(None, description="Profundidad del tránsito (ppm)")
    koi_impact:   Optional[float] = Field(None, description="Parámetro de impacto (0-1)")
    koi_incl:     Optional[float] = Field(None, description="Inclinación orbital (grados)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "koi_period": 365.0,
                "koi_prad": 1.0,
                "koi_teq": 255.0,
                "koi_insol": 1.0,
                "koi_steff": 5778.0,
                "koi_slogg": 4.44,
                "koi_srad": 1.0,
                "koi_smass": 1.0,
                "koi_duration": 13.0,
                "koi_depth": 84.0,
                "koi_impact": 0.1,
                "koi_incl": 89.9,
            }
        }
    }


class PredictRequest(ExoplanetFeatures):
    """Request para predicción de un solo candidato."""
    kepoi_name: Optional[str] = Field(None, description="Nombre KOI (opcional, solo para trazabilidad)")


class BatchPredictRequest(BaseModel):
    candidates: list[ExoplanetFeatures] = Field(..., min_length=1, max_length=500)


# ─── Output ───────────────────────────────────────────────────────────────────

ClassificationLiteral = Literal["CONFIRMED", "FALSE_POSITIVE", "CANDIDATE"]


class PredictResponse(BaseModel):
    classification:  ClassificationLiteral
    mlConfidence:    float = Field(..., ge=0.0, le=1.0, description="Confianza de la clase predicha (0-1)")
    probConfirmed:   float = Field(..., ge=0.0, le=1.0)
    probFalsePos:    float = Field(..., ge=0.0, le=1.0)
    probCandidate:   float = Field(..., ge=0.0, le=1.0)
    model_version:   str
    features_used:   int   = Field(..., description="Número de features no-nulas usadas")


class BatchPredictResponse(BaseModel):
    results:        list[PredictResponse]
    total:          int
    model_version:  str


# ─── Model metadata ───────────────────────────────────────────────────────────

class FeatureImportance(BaseModel):
    feature: str
    importance: float


class ModelInfo(BaseModel):
    version:            str
    algorithm:          str
    trained_at:         str
    n_estimators:       int
    max_depth:          int
    training_samples:   int
    test_samples:       int
    accuracy:           float
    f1_weighted:        float
    f1_confirmed:       float
    f1_false_positive:  float
    feature_importances: list[FeatureImportance]
    features:           list[str]
    classes:            list[str]
    data_source:        str


class RetrainResponse(BaseModel):
    status:          str
    message:         str
    current_version: str


class HealthResponse(BaseModel):
    status:        str
    service:       str
    model_loaded:  bool
    model_version: Optional[str]
    accuracy:      Optional[float]
    f1_score:      Optional[float]
