# ASTRALIS — Backend

API REST del Observatorio Astronómico Nacional · UNAL 2026-1S

## Setup local (5 minutos)

```bash
# 1. Crear entorno virtual
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Variables de entorno
cp .env.example .env
# Edita .env si necesitas cambiar algo (para desarrollo local no es obligatorio)

# 4. Levantar el servidor
uvicorn app.main:app --reload --port 8000
```

La API queda en **http://localhost:8000**
Swagger UI en **http://localhost:8000/docs**

## Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login → devuelve JWT |
| GET | `/api/exoplanets` | Lista paginada con filtros |
| GET | `/api/exoplanets/{id}` | Detalle de un exoplaneta |
| GET | `/api/iss/position` | Posición actual de la ISS |
| GET | `/api/simulation/bodies` | Cuerpos del sistema solar |

## Agregar el CSV de NASA

1. Descarga el CSV de la NASA Exoplanet Archive:  
   https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=cumulative

2. Guárdalo como `data/kepler_exoplanets.csv`

Sin el CSV, el backend usa 3 exoplanetas de ejemplo para que el frontend no se rompa.

## Para E2 (DevOps)

El endpoint `/health` devuelve `{"status": "ok"}` — úsalo como health check en Railway/Render.

El `Dockerfile` está listo para producción.

## Próximos pasos (Fase 2)

- [ ] Conectar PostgreSQL (reemplazar `_users_db` en `routers/auth.py`)
- [ ] Rate limiting con `slowapi`
- [ ] Endpoint `/api/exoplanets/{id}/lightcurve`
- [ ] Conectar microservicio ML de E3 en `/api/ml/classify`
