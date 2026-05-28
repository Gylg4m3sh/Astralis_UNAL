from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.models import Exoplanet, MLPredictionRequest, MLPredictionResponse
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["Exoplanets & ML"])

# Mock DB
exoplanets_db = [
    Exoplanet(id=1, name="Kepler-186f", discovery_method="Transit", mass=1.4, radius=1.1, orbital_period=129.9, is_confirmed=True),
    Exoplanet(id=2, name="Proxima Centauri b", discovery_method="Radial Velocity", mass=1.27, radius=None, orbital_period=11.2, is_confirmed=True),
    Exoplanet(id=3, name="KOI-456.04", discovery_method="Transit", mass=None, radius=1.9, orbital_period=378.0, is_confirmed=False),
]

@router.get("/exoplanets", response_model=List[Exoplanet])
def get_exoplanets(is_confirmed: Optional[bool] = None, discovery_method: Optional[str] = None):
    results = exoplanets_db
    if is_confirmed is not None:
        results = [e for e in results if e.is_confirmed == is_confirmed]
    if discovery_method:
        results = [e for e in results if e.discovery_method.lower() == discovery_method.lower()]
    return results

@router.get("/exoplanets/{exoplanet_id}", response_model=Exoplanet)
def get_exoplanet(exoplanet_id: int):
    for e in exoplanets_db:
        if e.id == exoplanet_id:
            return e
    raise HTTPException(status_code=404, detail="Exoplanet not found")

@router.get("/exoplanets/{exoplanet_id}/light-curve")
def get_light_curve(exoplanet_id: int):
    # This endpoint mocks the retrieval of a transit light curve for RF-07
    return {
        "exoplanet_id": exoplanet_id,
        "time_series": [0.0, 1.0, 2.0, 3.0, 4.0],
        "flux": [1.0, 1.0, 0.98, 1.0, 1.0],
        "description": "Mock light curve data demonstrating a planet transit."
    }

@router.post("/ml/predict", response_model=MLPredictionResponse)
def predict_exoplanet(features: MLPredictionRequest, current_user: str = Depends(get_current_user)):
    # This mocks the RF-04 interaction with the ML microservice
    # Let's say if radius is mostly Earth-like, it gives a high confidence
    confidence = 0.95 if 0.8 <= features.radius <= 2.0 else 0.45
    return MLPredictionResponse(
        is_exoplanet_candidate=confidence > 0.5,
        confidence=confidence
    )
