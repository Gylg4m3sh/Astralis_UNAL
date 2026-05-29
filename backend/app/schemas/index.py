"""
Schemas Pydantic — espejean EXACTAMENTE los tipos de types/index.ts del frontend.
Cualquier cambio aquí debe reflejarse allá y viceversa.
"""
from __future__ import annotations
from typing import Generic, Literal, TypeVar, Optional
from pydantic import BaseModel, EmailStr

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Exoplanet  →  interface Exoplanet en types/index.ts
# ---------------------------------------------------------------------------
class Exoplanet(BaseModel):
    id: str
    name: str
    hostStar: str
    orbitalPeriod: float        # días
    planetRadius: float         # radios terrestres
    equilibriumTemp: float      # Kelvin
    classification: Literal["CONFIRMED", "FALSE_POSITIVE", "CANDIDATE"]
    mlConfidence: float         # 0-1, del modelo E3
    discoveryYear: int


# ---------------------------------------------------------------------------
# OrbitalBody  →  interface OrbitalBody en types/index.ts
# ---------------------------------------------------------------------------
class OrbitalBody(BaseModel):
    id: str
    name: str
    mass: float                             # kg
    radius: float                           # km
    position: tuple[float, float, float]    # AU
    velocity: tuple[float, float, float]    # km/s
    color: str
    texture: Optional[str] = None


# ---------------------------------------------------------------------------
# ISSPosition  →  interface ISSPosition en types/index.ts
# ---------------------------------------------------------------------------
class ISSPosition(BaseModel):
    latitude: float
    longitude: float
    altitude: float     # km
    velocity: float     # km/h
    timestamp: int      # ms epoch


# ---------------------------------------------------------------------------
# PaginatedResponse<T>  →  interface PaginatedResponse<T> en types/index.ts
# ---------------------------------------------------------------------------
class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    total: int
    page: int
    pageSize: int


# ---------------------------------------------------------------------------
# Auth  →  interfaces User / LoginCredentials / RegisterCredentials / AuthResponse
# ---------------------------------------------------------------------------
class UserOut(BaseModel):
    id: str
    email: str
    username: str


class AuthResponse(BaseModel):
    user: UserOut
    token: str


class LoginCredentials(BaseModel):
    email: EmailStr
    password: str


class RegisterCredentials(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirmPassword: str
