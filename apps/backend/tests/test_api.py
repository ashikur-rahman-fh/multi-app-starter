import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


def assert_error_envelope(response, *, status_code: int, code: str):
    assert response.status_code == status_code
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == code
    assert isinstance(body["error"]["message"], str)
    assert body["error"]["message"]
    assert isinstance(body["error"]["details"], dict)


def test_health_returns_ok(client):
    response = client.get("/api/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_hello_returns_message(client):
    response = client.get("/api/hello/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from Django backend"}


def test_unknown_api_path_returns_404_envelope(client):
    response = client.get("/api/unknown/")
    assert_error_envelope(response, status_code=404, code="NOT_FOUND")
    assert response.json()["error"]["message"] == "We could not find the requested resource."


def test_health_post_returns_405_envelope(client):
    response = client.post("/api/health/")
    assert_error_envelope(response, status_code=405, code="METHOD_NOT_ALLOWED")
    assert response.json()["error"]["message"] == "This action is not supported."
