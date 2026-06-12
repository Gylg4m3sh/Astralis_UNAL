"""
Tests del microservicio ML de ASTRALIS.
Cubre: health, predict, batch, model/info, model/retrain.

Ejecutar:
  cd ml_service
  pytest tests/ -v --cov=app --cov-report=term-missing
"""
import pytest
from fastapi.testclient import TestClient

# Forzar dataset sintético para que los tests no dependan de internet
import unittest.mock as mock
from app.model import MLModel
from app.main import app, ml_model


@pytest.fixture(autouse=True, scope="session")
def train_with_synthetic():
    """Entrena el modelo con datos sintéticos una sola vez para toda la sesión de tests."""
    synthetic_df = MLModel._synthetic_dataset()
    ml_model._fit(synthetic_df)
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# ─── Health ───────────────────────────────────────────────────────────────────

def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["service"] == "astralis-ml"
    assert data["model_loaded"] is True
    assert data["accuracy"] is not None
    assert 0.0 <= data["accuracy"] <= 1.0


# ─── Model info ───────────────────────────────────────────────────────────────

def test_model_info(client):
    r = client.get("/model/info")
    assert r.status_code == 200
    data = r.json()
    assert data["algorithm"] == "RandomForestClassifier"
    assert data["n_estimators"] == 150
    assert data["max_depth"] == 15
    assert len(data["features"]) > 0
    assert len(data["feature_importances"]) > 0
    assert data["training_samples"] > 0
    assert data["test_samples"] > 0
    assert 0.0 <= data["accuracy"] <= 1.0
    assert 0.0 <= data["f1_weighted"] <= 1.0


# ─── Predict — casos válidos ───────────────────────────────────────────────────

TIERRA_LIKE = {
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

BINARIA_ECLIPSANTE = {
    "koi_period": 4.2,
    "koi_prad": 12.5,
    "koi_teq": 200.0,
    "koi_insol": 80.0,
    "koi_steff": 5100.0,
    "koi_slogg": 4.20,
    "koi_srad": 1.3,
    "koi_smass": 1.1,
    "koi_duration": 2.1,
    "koi_depth": 1500.0,
    "koi_impact": 0.8,
    "koi_incl": 82.0,
}


def test_predict_returns_valid_structure(client):
    r = client.post("/predict", json=TIERRA_LIKE)
    assert r.status_code == 200
    data = r.json()
    assert data["classification"] in ["CONFIRMED", "FALSE_POSITIVE", "CANDIDATE"]
    assert 0.0 <= data["mlConfidence"] <= 1.0
    assert 0.0 <= data["probConfirmed"] <= 1.0
    assert 0.0 <= data["probFalsePos"] <= 1.0
    assert 0.0 <= data["probCandidate"] <= 1.0
    assert data["model_version"] is not None
    assert data["features_used"] > 0


def test_predict_probabilities_sum_to_one(client):
    r = client.post("/predict", json=TIERRA_LIKE)
    data = r.json()
    total = data["probConfirmed"] + data["probFalsePos"] + data["probCandidate"]
    assert abs(total - 1.0) < 0.01


def test_predict_with_null_features_uses_imputation(client):
    """Features nulas deben imputarse con medianas, no romper la predicción."""
    partial = {"koi_period": 100.0, "koi_prad": 2.0}  # solo 2 features
    r = client.post("/predict", json=partial)
    assert r.status_code == 200
    data = r.json()
    assert data["classification"] in ["CONFIRMED", "FALSE_POSITIVE", "CANDIDATE"]
    # Solo 2 features fueron provistas
    assert data["features_used"] == 2


def test_predict_all_null_features(client):
    """Con todas las features nulas, el modelo debe devolver algo usando medianas."""
    r = client.post("/predict", json={})
    assert r.status_code == 200
    data = r.json()
    assert data["classification"] in ["CONFIRMED", "FALSE_POSITIVE", "CANDIDATE"]
    assert data["features_used"] == 0


def test_predict_with_kepoi_name(client):
    """El campo kepoi_name es opcional y no rompe la predicción."""
    payload = {**TIERRA_LIKE, "kepoi_name": "K00070.01"}
    r = client.post("/predict", json=payload)
    assert r.status_code == 200


# ─── Predict — batch ──────────────────────────────────────────────────────────

def test_predict_batch_basic(client):
    r = client.post("/predict/batch", json={"candidates": [TIERRA_LIKE, BINARIA_ECLIPSANTE]})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 2
    assert len(data["results"]) == 2
    for res in data["results"]:
        assert res["classification"] in ["CONFIRMED", "FALSE_POSITIVE", "CANDIDATE"]
        assert 0.0 <= res["mlConfidence"] <= 1.0


def test_predict_batch_single(client):
    r = client.post("/predict/batch", json={"candidates": [TIERRA_LIKE]})
    assert r.status_code == 200
    assert r.json()["total"] == 1


def test_predict_batch_empty_rejected(client):
    r = client.post("/predict/batch", json={"candidates": []})
    assert r.status_code == 422


def test_predict_batch_too_large_rejected(client):
    big = [TIERRA_LIKE] * 501
    r = client.post("/predict/batch", json={"candidates": big})
    assert r.status_code == 422


# ─── Model retrain ────────────────────────────────────────────────────────────

def test_retrain_endpoint_returns_202_style(client):
    """El endpoint /model/retrain debe aceptar la petición y devolver status 200."""
    r = client.post("/model/retrain")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "retraining_started"
    assert data["current_version"] is not None


# ─── Smoke tests de integridad del modelo ─────────────────────────────────────

def test_model_version_is_set():
    assert ml_model.version is not None
    assert len(ml_model.version) > 5


def test_model_has_medians_for_all_features():
    for feat in ml_model.meta.get("features", []):
        assert feat in ml_model.medians, f"Falta mediana para feature {feat}"


def test_label_encoder_has_three_classes():
    classes = set(ml_model.le.classes_)
    assert "CONFIRMED" in classes
    assert "FALSE_POSITIVE" in classes
    assert "CANDIDATE" in classes


def test_feature_importances_sum_to_one():
    total = sum(ml_model.rf.feature_importances_)
    assert abs(total - 1.0) < 0.001
