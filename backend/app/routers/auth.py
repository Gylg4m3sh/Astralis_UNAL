import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.index import LoginCredentials, RegisterCredentials, AuthResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(credentials: RegisterCredentials, db: Session = Depends(get_db)):
    if credentials.password != credentials.confirmPassword:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")

    existing = db.query(User).filter(User.email == credentials.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="El email ya está registrado")

    user = User(
        id=str(uuid.uuid4()),
        username=credentials.username,
        email=credentials.email,
        hashed_password=hash_password(credentials.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.email)
    return AuthResponse(
        user=UserOut(id=user.id, email=user.email, username=user.username),
        token=token,
    )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginCredentials, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    token = create_access_token(subject=user.email)
    return AuthResponse(
        user=UserOut(id=user.id, email=user.email, username=user.username),
        token=token,
    )
