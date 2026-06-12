from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_exoplanets():
    response = client.get("/api/exoplanets?page=1&pageSize=3")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
    assert "page" in data
    assert "pageSize" in data
    assert len(data["data"]) <= 3

def test_get_exoplanet_detail():
    # Usando el id de Kepler-22b (de los datos mock/descargados)
    response = client.get("/api/exoplanets/10593626")
    if response.status_code == 200:
        planet = response.json()
        assert planet["id"] == "10593626"
        assert "name" in planet
        assert "planetRadius" in planet
    else:
        # Si no se ha descargado el CSV y el mock fallback tuviera otros IDs
        assert response.status_code == 404

def test_get_exoplanet_not_found():
    response = client.get("/api/exoplanets/invalid_id_999999")
    assert response.status_code == 404

def test_exoplanet_light_curve():
    # Usando el id de Kepler-22b
    response = client.get("/api/exoplanets/10593626/lightcurve")
    if response.status_code == 200:
        curve = response.json()
        assert isinstance(curve, list)
        assert len(curve) > 0
        assert "time" in curve[0]
        assert "flux" in curve[0]
        assert "fluxNoise" in curve[0]
    else:
        assert response.status_code == 404
