import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

database_url = settings.DATABASE_URL

# Forzar SQLite si estamos ejecutando tests (evita requerir Postgres en CI/CD o local)
is_testing = "pytest" in sys.modules or "unittest" in sys.modules

if is_testing:
    database_url = "sqlite:///./astralis_test.db"
else:
    try:
        if database_url.startswith("postgresql"):
            import psycopg2
    except ImportError:
        # Usar sqlite en desarrollo si no está instalado psycopg2
        database_url = "sqlite:///./astralis_fallback.db"

if database_url.startswith("sqlite"):
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
