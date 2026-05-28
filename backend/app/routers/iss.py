import time
import httpx
from fastapi import APIRouter, HTTPException
from app.schemas.index import ISSPosition

router = APIRouter(prefix="/api/iss", tags=["iss"])

# Open Notify no devuelve altitud ni velocidad — usamos valores reales promedio
_ISS_ALTITUDE_KM = 408.0
_ISS_VELOCITY_KMH = 27600.0


@router.get("/position", response_model=ISSPosition)
async def get_iss_position():
    """
    Proxy a http://api.open-notify.org/iss-now.json
    Añade altitud y velocidad promedio (Open Notify no las expone).
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get("http://api.open-notify.org/iss-now.json")
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Open Notify API no respondió a tiempo")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Error contactando Open Notify: {str(e)}")

    return ISSPosition(
        latitude=float(data["iss_position"]["latitude"]),
        longitude=float(data["iss_position"]["longitude"]),
        altitude=_ISS_ALTITUDE_KM,
        velocity=_ISS_VELOCITY_KMH,
        timestamp=int(time.time() * 1000),  # ms epoch, igual que Date.now() en JS
    )
