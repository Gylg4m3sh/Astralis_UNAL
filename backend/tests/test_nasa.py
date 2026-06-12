import pandas as pd
from app.services.nasa import _load_df, get_exoplanets, get_exoplanet_by_id

def test_nasa_load_df():
    df = _load_df()
    assert isinstance(df, pd.DataFrame)
    assert not df.empty
    
    # Verificar columnas críticas
    required_cols = ["id", "name", "hostStar", "orbitalPeriod", "planetRadius", "classification"]
    for col in required_cols:
        assert col in df.columns, f"Columna {col} faltante en el DataFrame de exoplanetas"

def test_nasa_get_exoplanets():
    res = get_exoplanets(page=1, page_size=2)
    assert "data" in res
    assert len(res["data"]) <= 2
    
    # Verificar estructura del registro
    if len(res["data"]) > 0:
        record = res["data"][0]
        assert "id" in record
        assert "name" in record
        assert "classification" in record

def test_nasa_get_exoplanet_by_id():
    # Intentar obtener un exoplaneta conocido (Kepler-22b con ID '10593626')
    planet = get_exoplanet_by_id("10593626")
    if planet is not None:
        assert planet["name"] == "Kepler-22 b"
        assert planet["id"] == "10593626"
    
    # Intentar obtener un id inexistente
    assert get_exoplanet_by_id("non_existent_id") is None
