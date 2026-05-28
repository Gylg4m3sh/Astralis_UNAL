from pydantic import BaseModel, EmailStr
from typing import Optional, List

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    username: str
    email: EmailStr
    
    class Config:
        from_attributes = True

# Exoplanet Models
class Exoplanet(BaseModel):
    id: int
    name: str
    discovery_method: str
    mass: Optional[float] = None
    radius: Optional[float] = None
    orbital_period: Optional[float] = None
    is_confirmed: bool

class ExoplanetFilter(BaseModel):
    is_confirmed: Optional[bool] = None
    discovery_method: Optional[str] = None

# ISS Models
class ISSPosition(BaseModel):
    timestamp: int
    latitude: float
    longitude: float

# ML Prediction
class MLPredictionRequest(BaseModel):
    mass: float
    radius: float
    orbital_period: float
    stellar_flux: float

class MLPredictionResponse(BaseModel):
    is_exoplanet_candidate: bool
    confidence: float
