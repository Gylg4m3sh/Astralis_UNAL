from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "ok"
    assert res["service"] == "astralis-backend"
    assert "ml_service" in res
