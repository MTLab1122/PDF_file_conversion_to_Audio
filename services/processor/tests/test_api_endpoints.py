import pytest
from fastapi.testclient import TestClient
from services.processor.app.main import app
from services.processor.app.config import settings

client = TestClient(app)

def test_liveness_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_readiness_health_endpoint():
    response = client.get("/api/health/ready")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "checks" in data
    assert "storage" in data["checks"]
    assert "ffmpeg" in data["checks"]
    assert data["checks"]["ffmpeg"] is True

def test_list_languages_endpoint():
    response = client.get("/api/languages")
    assert response.status_code == 200
    data = response.json()
    assert "languages" in data
    assert len(data["languages"]) >= 5
    codes = [l["code"] for l in data["languages"]]
    assert "en-US" in codes
    assert "es-ES" in codes

def test_list_voices_endpoint():
    response = client.get("/api/voices")
    assert response.status_code == 200
    data = response.json()
    assert "voices" in data
    assert data["count"] > 0

def test_protected_document_validate_requires_internal_api_key():
    # Without header
    res_no_auth = client.post("/api/documents/validate", json={"file_path": "test.pdf"})
    assert res_no_auth.status_code == 401

    # With invalid header
    res_bad_auth = client.post(
        "/api/documents/validate",
        json={"file_path": "test.pdf"},
        headers={"X-Internal-API-Key": "wrong-key"},
    )
    assert res_bad_auth.status_code == 401

    # With correct header (fails with bad file path, but passes auth)
    res_good_auth = client.post(
        "/api/documents/validate",
        json={"file_path": "non_existent.pdf"},
        headers={"X-Internal-API-Key": settings.INTERNAL_API_KEY},
    )
    assert res_good_auth.status_code == 400

