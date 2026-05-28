from fastapi.testclient import TestClient
from app.main import app
import pytest

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_index():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_register():
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "strongpassword123"
    })
    assert response.status_code == 201
    assert response.json()["username"] == "testuser"

def test_register_duplicate():
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "strongpassword123"
    })
    assert response.status_code == 400

def test_login():
    response = client.post("/auth/login", data={
        "username": "testuser",
        "password": "strongpassword123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_get_exoplanets():
    response = client.get("/api/exoplanets")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_exoplanet_by_id():
    response = client.get("/api/exoplanets/1")
    assert response.status_code == 200
    assert response.json()["name"] == "Kepler-186f"

def test_predict_unauthorized():
    response = client.post("/api/ml/predict", json={
        "mass": 1.0,
        "radius": 1.0,
        "orbital_period": 365,
        "stellar_flux": 1.0
    })
    # Cannot hit predict without token
    assert response.status_code == 401
    
def test_predict_authorized():
    # Login to get token
    login_response = client.post("/auth/login", data={
        "username": "testuser",
        "password": "strongpassword123"
    })
    token = login_response.json()["access_token"]
    
    # Send predict request
    response = client.post(
        "/api/ml/predict", 
        json={"mass": 1.0, "radius": 1.0, "orbital_period": 365.0, "stellar_flux": 1.0},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert "is_exoplanet_candidate" in response.json()

def test_iss_position():
    response = client.get("/api/science/iss/position")
    assert response.status_code == 200
    assert "latitude" in response.json()

def test_orbital_simulation():
    response = client.get("/api/science/orbital-sim")
    assert response.status_code == 200
    assert "bodies" in response.json()
