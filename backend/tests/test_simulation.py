from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_simulation_bodies():
    response = client.get("/api/simulation/bodies")
    assert response.status_code == 200
    bodies = response.json()
    assert isinstance(bodies, list)
    
    # Obtener lista de IDs
    body_ids = [body["id"] for body in bodies]
    
    # Verificar que los planetas estándar y los agregados existen
    expected_bodies = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
    for body_id in expected_bodies:
        assert body_id in body_ids, f"{body_id} no se encuentra en la simulación"
