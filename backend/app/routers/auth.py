"""
Router de autenticación.

Por ahora usa un dict en memoria para no requerir PostgreSQL desde el día 1.
Cuando tengas la DB lista, reemplaza `_users_db` con queries SQLAlchemy —
la interfaz del router no cambia.
"""
import uuid
from fastapi import APIRouter, HTTPException, status
from app.schemas.index import LoginCredentials, RegisterCredentials, AuthResponse, UserOut
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Almacenamiento temporal en memoria
# Reemplazar con SQLAlchemy + PostgreSQL en Fase 2
# ---------------------------------------------------------------------------
_users_db: dict[str, dict] = {}  # email → {id, username, email, hashed_password}


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(credentials: RegisterCredentials):
    if credentials.password != credentials.confirmPassword:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")

    if credentials.email in _users_db:
        raise HTTPException(status_code=409, detail="El email ya está registrado")

    user_id = str(uuid.uuid4())
    _users_db[credentials.email] = {
        "id": user_id,
        "username": credentials.username,
        "email": credentials.email,
        "hashed_password": hash_password(credentials.password),
    }

    token = create_access_token(subject=credentials.email)
    return AuthResponse(
        user=UserOut(id=user_id, email=credentials.email, username=credentials.username),
        token=token,
    )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginCredentials):
    user = _users_db.get(credentials.email)
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    token = create_access_token(subject=credentials.email)
    return AuthResponse(
        user=UserOut(id=user["id"], email=user["email"], username=user["username"]),
        token=token,
    )
