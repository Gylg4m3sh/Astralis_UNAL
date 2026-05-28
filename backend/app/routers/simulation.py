from fastapi import APIRouter
from app.schemas.index import OrbitalBody

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

# Datos iniciales reales — posiciones en AU, velocidades en km/s
# Fuente: JPL Horizons (valores medios, no en tiempo real todavía)
# Cuando E3 conecte JPL Horizons, este endpoint llamará al servicio de E3
_BODIES: list[dict] = [
    {
        "id": "sun",
        "name": "Sol",
        "mass": 1.989e30,
        "radius": 696340.0,
        "position": [0.0, 0.0, 0.0],
        "velocity": [0.0, 0.0, 0.0],
        "color": "#FDB813",
        "texture": None,
    },
    {
        "id": "mercury",
        "name": "Mercurio",
        "mass": 3.285e23,
        "radius": 2439.7,
        "position": [0.387, 0.0, 0.0],
        "velocity": [0.0, 47.87, 0.0],
        "color": "#B5B5B5",
        "texture": None,
    },
    {
        "id": "venus",
        "name": "Venus",
        "mass": 4.867e24,
        "radius": 6051.8,
        "position": [0.723, 0.0, 0.0],
        "velocity": [0.0, 35.02, 0.0],
        "color": "#E8C96B",
        "texture": None,
    },
    {
        "id": "earth",
        "name": "Tierra",
        "mass": 5.972e24,
        "radius": 6371.0,
        "position": [1.0, 0.0, 0.0],
        "velocity": [0.0, 29.78, 0.0],
        "color": "#4B9CD3",
        "texture": None,
    },
    {
        "id": "mars",
        "name": "Marte",
        "mass": 6.39e23,
        "radius": 3389.5,
        "position": [1.52, 0.0, 0.0],
        "velocity": [0.0, 24.07, 0.0],
        "color": "#C1440E",
        "texture": None,
    },
    {
        "id": "jupiter",
        "name": "Júpiter",
        "mass": 1.898e27,
        "radius": 69911.0,
        "position": [5.2, 0.0, 0.0],
        "velocity": [0.0, 13.07, 0.0],
        "color": "#C88B3A",
        "texture": None,
    },
    {
        "id": "saturn",
        "name": "Saturno",
        "mass": 5.683e26,
        "radius": 58232.0,
        "position": [9.58, 0.0, 0.0],
        "velocity": [0.0, 9.69, 0.0],
        "color": "#E4D191",
        "texture": None,
    },
]


@router.get("/bodies", response_model=list[OrbitalBody])
async def get_bodies():
    """
    Devuelve los cuerpos del sistema solar para el simulador orbital.
    Por ahora: posiciones medias reales (no en tiempo real).
    Fase 3: E3 conectará JPL Horizons para posiciones en tiempo real.
    """
    return _BODIES
