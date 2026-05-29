"""
Carga el CSV del NASA Exoplanet Archive y lo mapea a los schemas del frontend.

Columnas usadas del CSV (descarga desde exoplanetarchive.ipac.caltech.edu):
  kepid          → id
  kepler_name    → name  (o kepoi_name si kepler_name está vacío)
  koi_slogg      → (no usado directamente)
  koi_steff      → equilibriumTemp (aprox — mejor usar koi_teq si existe)
  koi_period     → orbitalPeriod
  koi_prad       → planetRadius
  koi_teq        → equilibriumTemp
  koi_disposition → classification  (CONFIRMED / FALSE POSITIVE / CANDIDATE)
  koi_score      → mlConfidence
  koi_time0bk    → (no usado)
  ra / dec       → (no usado aquí, útil para mapa estelar)

Descarga el CSV aquí:
https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=cumulative
"""
from __future__ import annotations
import os
import pandas as pd
from app.schemas.index import Exoplanet

# Ruta al CSV — ponlo en backend/data/kepler_exoplanets.csv
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "kepler_exoplanets.csv")

# Mapeo: columna CSV  →  campo del schema
COLUMN_MAP = {
    "kepid":           "id",
    "kepler_name":     "name",
    "koi_shost":       "hostStar",
    "koi_period":      "orbitalPeriod",
    "koi_prad":        "planetRadius",
    "koi_teq":         "equilibriumTemp",
    "koi_disposition": "classification",
    "koi_score":       "mlConfidence",
}

# Mapeo de valores de clasificación NASA → literales del frontend
DISPOSITION_MAP = {
    "CONFIRMED":      "CONFIRMED",
    "FALSE POSITIVE": "FALSE_POSITIVE",
    "CANDIDATE":      "CANDIDATE",
}

_df_cache: pd.DataFrame | None = None


def _load_df() -> pd.DataFrame:
    global _df_cache
    if _df_cache is not None:
        return _df_cache

    if not os.path.exists(CSV_PATH):
        # Si aún no tienes el CSV, devuelve datos de ejemplo para no romper el frontend
        return _mock_df()

    df = pd.read_csv(CSV_PATH, comment="#")  # el CSV de NASA tiene líneas de comentario con #

    # Renombrar columnas
    df = df.rename(columns=COLUMN_MAP)

    # Normalizar clasificación
    df["classification"] = df["classification"].map(DISPOSITION_MAP).fillna("CANDIDATE")

    # id como string
    df["id"] = df["id"].astype(str)

    # Nombre: usar kepler_name si existe, si no kepoi_name
    if "name" not in df.columns or df["name"].isna().all():
        if "kepoi_name" in df.columns:
            df["name"] = df["kepoi_name"]
        else:
            df["name"] = "KOI-" + df["id"]

    df["name"] = df["name"].fillna("KOI-" + df["id"])

    # hostStar: si no existe la columna, derivarla del nombre
    if "hostStar" not in df.columns:
        df["hostStar"] = df["name"].str.replace(r"\s[b-z]$", "", regex=True)

    # Año de descubrimiento — el CSV Kepler no tiene esta columna explícita,
    # pero la mayoría de confirmaciones son de 2014-2016. Usamos 2014 como default.
    df["discoveryYear"] = 2014

    # mlConfidence: koi_score va de 0-1. Si no existe, 0.5
    if "mlConfidence" not in df.columns:
        df["mlConfidence"] = 0.5
    else:
        df["mlConfidence"] = df["mlConfidence"].fillna(0.5)

    # Eliminar filas con datos críticos faltantes
    df = df.dropna(subset=["orbitalPeriod", "planetRadius"])

    # Eliminar duplicados por id — el CSV Kepler puede tener múltiples filas por objeto
    df = df.drop_duplicates(subset=["id"])
    # Rellenar equilibriumTemp faltante con 0 (el frontend puede manejarlo)
    df["equilibriumTemp"] = df["equilibriumTemp"].fillna(0)

    # Solo quedarnos con las columnas que necesitamos
    keep = ["id", "name", "hostStar", "orbitalPeriod", "planetRadius",
            "equilibriumTemp", "classification", "mlConfidence", "discoveryYear"]
    df = df[keep]

    _df_cache = df
    return df


def get_exoplanets(
    page: int = 1,
    page_size: int = 10,
    filter_classification: str | None = None,
) -> dict:
    df = _load_df()

    if filter_classification:
        df = df[df["classification"] == filter_classification]

    total = len(df)
    start = (page - 1) * page_size
    slice_ = df.iloc[start : start + page_size]

    records = slice_.to_dict(orient="records")

    return {
        "data": records,
        "total": total,
        "page": page,
        "pageSize": page_size,
    }


def get_exoplanet_by_id(exoplanet_id: str) -> dict | None:
    df = _load_df()
    row = df[df["id"] == exoplanet_id]
    if row.empty:
        return None
    return row.iloc[0].to_dict()


# ---------------------------------------------------------------------------
# Datos de ejemplo para cuando aún no tienes el CSV descargado
# ---------------------------------------------------------------------------
def _mock_df() -> pd.DataFrame:
    return pd.DataFrame([
        {
            "id": "10666592",
            "name": "Kepler-22b",
            "hostStar": "Kepler-22",
            "orbitalPeriod": 289.8,
            "planetRadius": 2.4,
            "equilibriumTemp": 295.0,
            "classification": "CONFIRMED",
            "mlConfidence": 0.97,
            "discoveryYear": 2011,
        },
        {
            "id": "10797460",
            "name": "Kepler-10b",
            "hostStar": "Kepler-10",
            "orbitalPeriod": 0.837,
            "planetRadius": 1.47,
            "equilibriumTemp": 2169.0,
            "classification": "CONFIRMED",
            "mlConfidence": 0.99,
            "discoveryYear": 2011,
        },
        {
            "id": "10854555",
            "name": "KOI-70.01",
            "hostStar": "KOI-70",
            "orbitalPeriod": 10.854,
            "planetRadius": 2.03,
            "equilibriumTemp": 880.0,
            "classification": "CANDIDATE",
            "mlConfidence": 0.62,
            "discoveryYear": 2014,
        },
    ])
