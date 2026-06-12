"""
MLModel — Entrenamiento, persistencia e inferencia del clasificador de exoplanetas.

Flujo:
  1. Al arrancar, intenta cargar models/rf_model.joblib
  2. Si no existe, descarga el CSV de NASA y entrena desde cero
  3. Serializa modelo + metadatos + medianas de imputación
  4. Expone predict_one() y predict_batch() al router de FastAPI
"""
from __future__ import annotations

import io
import os
import logging
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import joblib
import httpx

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, f1_score, classification_report
)

from app.schemas import (
    PredictRequest, PredictResponse,
    BatchPredictRequest, BatchPredictResponse,
    ExoplanetFeatures, ModelInfo, FeatureImportance,
)

logger = logging.getLogger(__name__)

# ─── Constantes ───────────────────────────────────────────────────────────────

MODEL_DIR  = Path(__file__).parent.parent / "models"
MODEL_PATH = MODEL_DIR / "rf_model.joblib"
META_PATH  = MODEL_DIR / "model_meta.joblib"

# Mismas features que en el notebook E3
ML_FEATURES = [
    "koi_period", "koi_prad", "koi_teq", "koi_insol",
    "koi_steff", "koi_slogg", "koi_srad", "koi_smass",
    "koi_duration", "koi_depth", "koi_impact", "koi_incl",
]

# Mapeo de etiquetas NASA → literales del sistema
DISPOSITION_MAP = {
    "CONFIRMED":      "CONFIRMED",
    "FALSE POSITIVE": "FALSE_POSITIVE",
    "CANDIDATE":      "CANDIDATE",
}

# URL de descarga directa del NASA Exoplanet Archive (TAP API)
NASA_TAP_URL = (
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?"
    "query=select+kepoi_name,koi_disposition,"
    "koi_period,koi_prad,koi_teq,koi_insol,"
    "koi_steff,koi_slogg,koi_srad,koi_smass,"
    "koi_duration,koi_depth,koi_impact,koi_incl"
    "+from+cumulative"
    "&format=csv"
)


class MLModel:
    """Gestiona el ciclo de vida completo del modelo Random Forest."""

    def __init__(self):
        self.rf: RandomForestClassifier | None = None
        self.le: LabelEncoder | None = None
        self.medians: dict[str, float] = {}
        self.metrics: dict[str, Any] = {}
        self.meta: dict[str, Any] = {}
        self.is_loaded: bool = False
        self.version: str | None = None
        MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # ─── Carga / entrenamiento ─────────────────────────────────────────────

    def load_or_train(self):
        """Carga el modelo serializado; si no existe, entrena desde cero."""
        if MODEL_PATH.exists() and META_PATH.exists():
            try:
                self._load_from_disk()
                return
            except Exception as e:
                logger.warning(f"No se pudo cargar modelo guardado ({e}). Re-entrenando...")

        self._train_and_save()

    def _load_from_disk(self):
        logger.info("Cargando modelo desde disco...")
        bundle = joblib.load(MODEL_PATH)
        self.rf      = bundle["rf"]
        self.le      = bundle["le"]
        self.medians = bundle["medians"]
        meta         = joblib.load(META_PATH)
        self.metrics = meta["metrics"]
        self.meta    = meta
        self.version = meta["version"]
        self.is_loaded = True
        logger.info(f"Modelo cargado: versión {self.version}")

    def retrain(self):
        """Re-entrena en background (llamado desde el endpoint /model/retrain)."""
        logger.info("Re-entrenamiento iniciado...")
        try:
            self._train_and_save()
            logger.info(f"Re-entrenamiento completado. Nueva versión: {self.version}")
        except Exception as e:
            logger.error(f"Error en re-entrenamiento: {e}")

    # ─── Entrenamiento ─────────────────────────────────────────────────────

    def _train_and_save(self):
        df = self._fetch_data()
        self._fit(df)
        self._persist()

    def _fetch_data(self) -> pd.DataFrame:
        """Descarga el CSV de la NASA. Fallback a datos sintéticos si no hay internet."""
        logger.info("Descargando dataset Kepler desde NASA Exoplanet Archive...")
        try:
            with httpx.Client(timeout=45.0) as client:
                r = client.get(NASA_TAP_URL)
                r.raise_for_status()
            df = pd.read_csv(io.StringIO(r.text), comment="#")
            logger.info(f"Dataset descargado: {len(df):,} candidatos")
            return df
        except Exception as e:
            logger.warning(f"NASA API no accesible ({e}). Usando dataset sintético para demo.")
            return self._synthetic_dataset()

    def _fit(self, df: pd.DataFrame):
        """Prepara datos, entrena RandomForest y calcula métricas."""
        logger.info("Preparando datos y entrenando modelo...")

        # Filtrar filas con etiqueta válida
        valid = ["CONFIRMED", "FALSE POSITIVE", "CANDIDATE"]
        df = df[df["koi_disposition"].isin(valid)].copy()

        # Solo features disponibles
        available = [f for f in ML_FEATURES if f in df.columns]
        df_ml = df[available + ["koi_disposition"]].copy()

        # Imputar nulos con la mediana por clase (imputación simple robusta)
        self.medians = {col: float(df_ml[col].median()) for col in available}
        for col in available:
            df_ml[col] = df_ml[col].fillna(self.medians[col])

        # Normalizar etiquetas
        df_ml["label"] = df_ml["koi_disposition"].map(DISPOSITION_MAP).fillna("CANDIDATE")

        X = df_ml[available].values
        self.le = LabelEncoder()
        y = self.le.fit_transform(df_ml["label"])

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        self.rf = RandomForestClassifier(
            n_estimators=150,
            max_depth=15,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        self.rf.fit(X_train, y_train)

        # Métricas
        y_pred = self.rf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        f1w = f1_score(y_test, y_pred, average="weighted")
        report = classification_report(y_test, y_pred, target_names=self.le.classes_, output_dict=True)

        self.metrics = {
            "accuracy":       round(float(acc), 4),
            "f1_weighted":    round(float(f1w), 4),
            "f1_per_class":   {cls: round(report[cls]["f1-score"], 4) for cls in self.le.classes_},
            "training_samples": int(len(X_train)),
            "test_samples":     int(len(X_test)),
        }

        # Importancia de features
        fi = sorted(
            zip(available, self.rf.feature_importances_),
            key=lambda x: x[1], reverse=True
        )
        self.metrics["feature_importances"] = [(f, round(float(v), 4)) for f, v in fi]

        now = datetime.now(timezone.utc).isoformat()
        data_hash = hashlib.md5(str(len(df)).encode()).hexdigest()[:8]
        self.version = f"1.{now[:10].replace('-','')}.{data_hash}"

        self.meta = {
            "version":          self.version,
            "trained_at":       now,
            "algorithm":        "RandomForestClassifier",
            "n_estimators":     150,
            "max_depth":        15,
            "features":         available,
            "classes":          list(self.le.classes_),
            "data_source":      "NASA Exoplanet Archive — cumulative table (Kepler)",
            "metrics":          self.metrics,
        }

        self.is_loaded = True
        logger.info(
            f"Modelo entrenado: accuracy={acc:.3f}, f1={f1w:.3f}, "
            f"versión={self.version}, features={len(available)}"
        )

    def _persist(self):
        joblib.dump({"rf": self.rf, "le": self.le, "medians": self.medians}, MODEL_PATH)
        joblib.dump(self.meta, META_PATH)
        logger.info(f"Modelo guardado en {MODEL_PATH}")

    # ─── Inferencia ────────────────────────────────────────────────────────

    def _features_to_array(self, feat: ExoplanetFeatures) -> tuple[np.ndarray, int]:
        """Convierte un ExoplanetFeatures en vector numpy, imputando nulos con medianas."""
        available_features = self.meta.get("features", ML_FEATURES)
        row = []
        used = 0
        for f in available_features:
            val = getattr(feat, f, None)
            if val is None:
                row.append(self.medians.get(f, 0.0))
            else:
                row.append(float(val))
                used += 1
        return np.array([row]), used

    def predict_one(self, request: PredictRequest) -> PredictResponse:
        X, n_used = self._features_to_array(request)
        pred_idx = int(self.rf.predict(X)[0])
        proba    = self.rf.predict_proba(X)[0]
        classes  = list(self.le.classes_)

        # Construir mapa completo de probabilidades (siempre 3 clases)
        prob_map: dict[str, float] = {c: 0.0 for c in ["CONFIRMED", "FALSE_POSITIVE", "CANDIDATE"]}
        for i, cls in enumerate(classes):
            if cls in prob_map:
                prob_map[cls] = float(proba[i])

        predicted_label = classes[pred_idx]
        confidence = float(proba[pred_idx])

        return PredictResponse(
            classification=predicted_label,
            mlConfidence=round(confidence, 4),
            probConfirmed=round(prob_map["CONFIRMED"], 4),
            probFalsePos=round(prob_map["FALSE_POSITIVE"], 4),
            probCandidate=round(prob_map["CANDIDATE"], 4),
            model_version=self.version,
            features_used=n_used,
        )

    def predict_batch(self, request: BatchPredictRequest) -> BatchPredictResponse:
        results = [self.predict_one(PredictRequest(**c.model_dump())) for c in request.candidates]
        return BatchPredictResponse(
            results=results,
            total=len(results),
            model_version=self.version,
        )

    def get_info(self) -> ModelInfo:
        fi = [
            FeatureImportance(feature=f, importance=v)
            for f, v in self.metrics.get("feature_importances", [])
        ]
        fpc = self.metrics.get("f1_per_class", {})
        return ModelInfo(
            version=self.version,
            algorithm=self.meta.get("algorithm", "RandomForestClassifier"),
            trained_at=self.meta.get("trained_at", ""),
            n_estimators=self.meta.get("n_estimators", 150),
            max_depth=self.meta.get("max_depth", 15),
            training_samples=self.metrics.get("training_samples", 0),
            test_samples=self.metrics.get("test_samples", 0),
            accuracy=self.metrics.get("accuracy", 0.0),
            f1_weighted=self.metrics.get("f1_weighted", 0.0),
            f1_confirmed=fpc.get("CONFIRMED", 0.0),
            f1_false_positive=fpc.get("FALSE_POSITIVE", 0.0),
            feature_importances=fi,
            features=self.meta.get("features", ML_FEATURES),
            classes=self.meta.get("classes", []),
            data_source=self.meta.get("data_source", ""),
        )

    # ─── Dataset sintético (fallback sin internet) ─────────────────────────

    @staticmethod
    def _synthetic_dataset() -> pd.DataFrame:
        """
        Genera un dataset sintético pequeño para que el servicio arranque
        sin conexión a la NASA. No usar en producción.
        """
        rng = np.random.default_rng(42)
        n = 600
        records = []

        # CONFIRMED: período largo, radio pequeño, temperatura moderada
        for _ in range(200):
            records.append({
                "koi_disposition": "CONFIRMED",
                "koi_period":   rng.uniform(10, 400),
                "koi_prad":     rng.uniform(0.5, 4.0),
                "koi_teq":      rng.uniform(200, 800),
                "koi_insol":    rng.uniform(0.1, 5.0),
                "koi_steff":    rng.uniform(4500, 6500),
                "koi_slogg":    rng.uniform(4.0, 4.7),
                "koi_srad":     rng.uniform(0.7, 1.4),
                "koi_smass":    rng.uniform(0.7, 1.3),
                "koi_duration": rng.uniform(2, 15),
                "koi_depth":    rng.uniform(50, 500),
                "koi_impact":   rng.uniform(0.0, 0.5),
                "koi_incl":     rng.uniform(85, 90),
            })

        # FALSE POSITIVE: radio grande, profundidad alta (binaria eclipsante)
        for _ in range(250):
            records.append({
                "koi_disposition": "FALSE POSITIVE",
                "koi_period":   rng.uniform(1, 20),
                "koi_prad":     rng.uniform(8, 20),
                "koi_teq":      rng.uniform(100, 400),
                "koi_insol":    rng.uniform(20, 200),
                "koi_steff":    rng.uniform(4000, 7000),
                "koi_slogg":    rng.uniform(3.5, 4.9),
                "koi_srad":     rng.uniform(0.9, 2.0),
                "koi_smass":    rng.uniform(0.8, 1.8),
                "koi_duration": rng.uniform(0.5, 5),
                "koi_depth":    rng.uniform(800, 5000),
                "koi_impact":   rng.uniform(0.5, 1.0),
                "koi_incl":     rng.uniform(60, 88),
            })

        # CANDIDATE: valores intermedios con ruido
        for _ in range(150):
            records.append({
                "koi_disposition": "CANDIDATE",
                "koi_period":   rng.uniform(5, 300),
                "koi_prad":     rng.uniform(1, 10),
                "koi_teq":      rng.uniform(150, 1000),
                "koi_insol":    rng.uniform(0.5, 50),
                "koi_steff":    rng.uniform(4200, 6800),
                "koi_slogg":    rng.uniform(3.8, 4.8),
                "koi_srad":     rng.uniform(0.8, 1.6),
                "koi_smass":    rng.uniform(0.75, 1.5),
                "koi_duration": rng.uniform(1, 12),
                "koi_depth":    rng.uniform(100, 1500),
                "koi_impact":   rng.uniform(0.0, 0.9),
                "koi_incl":     rng.uniform(70, 90),
            })

        return pd.DataFrame(records)
