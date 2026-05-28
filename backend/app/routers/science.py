from fastapi import APIRouter
import time
import random
from app.models import ISSPosition

router = APIRouter(prefix="/api/science", tags=["Science Modules"])

@router.get("/iss/position", response_model=ISSPosition)
def get_iss_position():
    # Mocking real-time ISS position for RF-11 (in a real scenario, calls Open Notify API)
    # Random drift around a baseline to simulate movement
    base_lat, base_lon = 20.0, -40.0
    return ISSPosition(
        timestamp=int(time.time()),
        latitude=base_lat + random.uniform(-0.1, 0.1),
        longitude=base_lon + random.uniform(-0.1, 0.1)
    )

@router.get("/orbital-sim")
def get_orbital_simulation():
    # Mock for RF-03 N-body simulation endpoints
    # Ideally this would communicate with the E3 module or execute the python script
    return {
        "status": "simulation_running",
        "bodies": [
            {"name": "Sun", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "mass": 1.989e30},
            {"name": "Earth", "x": 1.496e11, "y": 0.0, "vx": 0.0, "vy": 29780.0, "mass": 5.972e24}
        ]
    }
