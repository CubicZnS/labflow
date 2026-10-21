import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "labflow-api"


def test_stats_endpoint() -> None:
    response = client.post("/api/analysis/stats", json={"values": [1, 2, 3, 4]})
    assert response.status_code == 200
    body = response.json()
    assert body["n"] == 4
    assert body["mean"] == 2.5


def test_stats_endpoint_rejects_too_few_values() -> None:
    response = client.post("/api/analysis/stats", json={"values": [1]})
    assert response.status_code == 422


def test_linear_fit_endpoint() -> None:
    response = client.post(
        "/api/analysis/fit",
        json={"x": [0, 1, 2, 3], "y": [1, 3, 5, 7], "degree": 1},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["slope"] == pytest.approx(2.0)
    assert body["intercept"] == pytest.approx(1.0)
    assert body["r_squared"] == pytest.approx(1.0)


def test_polynomial_fit_endpoint() -> None:
    response = client.post(
        "/api/analysis/fit",
        json={"x": [-1, 0, 1, 2], "y": [1, 0, 1, 4], "degree": 2},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["degree"] == 2
    assert body["r_squared"] == 1.0


def test_fit_endpoint_rejects_mismatched_lengths() -> None:
    response = client.post(
        "/api/analysis/fit",
        json={"x": [0, 1, 2], "y": [1, 2], "degree": 1},
    )
    assert response.status_code == 422