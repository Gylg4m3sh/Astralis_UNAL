# ASTRALIS · Microservicio ML (E3)

Servicio FastAPI que clasifica candidatos Kepler usando Random Forest entrenado con el NASA Exoplanet Archive.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/health` | Estado del servicio y métricas del modelo activo |
| `POST` | `/predict` | Clasifica un candidato (devuelve classification + mlConfidence) |
| `POST` | `/predict/batch` | Clasifica hasta 500 candidatos en una llamada |
| `GET`  | `/model/info` | Versión, features, importancias y métricas completas |
| `POST` | `/model/retrain` | Re-entrena en background con datos frescos de la NASA |

## Arranque rápido

```bash
# Instalar dependencias
pip install -r requirements.txt

# Correr el servicio (entrena automáticamente al arrancar)
uvicorn app.main:app --reload --port 8001

# Documentación interactiva
open http://localhost:8001/docs
```

## Con Docker

```bash
docker build -t astralis-ml .
docker run -p 8001:8001 astralis-ml
```

## Ejemplo de uso

```bash
# Predecir un candidato tipo Tierra
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
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
    "koi_incl": 89.9
  }'
```

Respuesta esperada:
```json
{
  "classification": "CONFIRMED",
  "mlConfidence": 0.94,
  "probConfirmed": 0.94,
  "probFalsePos": 0.04,
  "probCandidate": 0.02,
  "model_version": "1.20260612.a3f9b1c2",
  "features_used": 12
}
```

## Tests

```bash
pytest tests/ -v --cov=app --cov-report=term-missing
```

## Integración con el backend (E1)

El backend llama a este servicio a través de `ML_SERVICE_URL` (en Docker: `http://ml:8001`,
en local: `http://localhost:8001`).

El cliente HTTP vive en [`../backend/app/services/ml_client.py`](../backend/app/services/ml_client.py)
y se usa desde [`../backend/app/routers/exoplanets.py`](../backend/app/routers/exoplanets.py),
que expone:

- `POST /api/exoplanets/predict` → proxy a `POST /predict`
- `GET  /api/exoplanets/{id}/ml-prediction` → traduce el exoplaneta del catálogo a
  features Kepler y llama a `POST /predict`
- `GET  /api/exoplanets/ml/model-info` → proxy a `GET /model/info`
- `POST /api/exoplanets/ml/retrain` → proxy a `POST /model/retrain`
- `GET  /health` del backend incluye el estado de este microservicio (`ml_service`)

Si este servicio no está disponible, el backend responde `503` en esos endpoints
(o `ml_service.available: false` en `/health`) sin caer por completo — los valores
`classification`/`mlConfidence` del catálogo seguirán viniendo del CSV de NASA
(`koi_disposition`/`koi_score`) como fallback.

## Features del modelo

| Feature | Descripción |
|---------|-------------|
| `koi_period` | Período orbital (días) |
| `koi_prad` | Radio del planeta (R⊕) |
| `koi_teq` | Temperatura de equilibrio (K) |
| `koi_insol` | Flujo de insolación (F⊕) |
| `koi_steff` | Temperatura efectiva estelar (K) |
| `koi_slogg` | Gravedad superficial estelar (log g) |
| `koi_srad` | Radio estelar (R☉) |
| `koi_smass` | Masa estelar (M☉) |
| `koi_duration` | Duración del tránsito (horas) |
| `koi_depth` | Profundidad del tránsito (ppm) |
| `koi_impact` | Parámetro de impacto |
| `koi_incl` | Inclinación orbital (grados) |

Los valores `None` se imputan automáticamente con la mediana del dataset de entrenamiento.
