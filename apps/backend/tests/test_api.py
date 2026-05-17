import os
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from api.app_metadata import APP_METADATA, PUBLIC_METADATA_KEYS

pytestmark = pytest.mark.django_db

FORBIDDEN_METADATA_KEYS = frozenset(
    {
        "gitSha",
        "commitSha",
        "buildTimestamp",
        "environment",
        "hostname",
        "serverEnvironment",
        "internalPath",
    }
)


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


def test_public_meta_returns_200(client):
    response = client.get("/api/public/meta/")
    assert response.status_code == 200


def test_public_meta_matches_source_module(client):
    response = client.get("/api/public/meta/")
    assert response.json() == APP_METADATA


def test_public_meta_exposes_only_public_fields(client):
    response = client.get("/api/public/meta/")
    body = response.json()
    assert set(body.keys()) == PUBLIC_METADATA_KEYS
    assert FORBIDDEN_METADATA_KEYS.isdisjoint(body.keys())


@patch.dict(
    os.environ,
    {
        "GIT_SHA": "abc123",
        "APP_VERSION": "9.9.9",
        "BUILD_TIMESTAMP": "2026-01-01T00:00:00Z",
        "DJANGO_SETTINGS_MODULE": "config.settings.test",
    },
)
def test_public_meta_ignores_environment_variables(client):
    response = client.get("/api/public/meta/")
    assert response.json() == APP_METADATA
