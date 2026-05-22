import pytest
from django.test import Client, override_settings
from rest_framework.settings import api_settings
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle


def _reload_drf_throttle_rates() -> None:
    api_settings.reload()
    SimpleRateThrottle.THROTTLE_RATES = api_settings.DEFAULT_THROTTLE_RATES


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def django_client():
    return Client(enforce_csrf_checks=True)


@pytest.mark.django_db
def test_health_endpoint_not_throttled(client):
    from django.conf import settings

    with override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_THROTTLE_RATES": {"anon": "2/minute", "api": "2/minute"},
        }
    ):
        _reload_drf_throttle_rates()
        for _ in range(5):
            response = client.get("/api/health/")
            assert response.status_code == 200


@pytest.mark.django_db
def test_hello_endpoint_throttled(client):
    from django.conf import settings

    with override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_THROTTLE_RATES": {"anon": "2/minute", "api": "2/minute"},
        }
    ):
        _reload_drf_throttle_rates()
        assert client.get("/api/hello/").status_code == 200
        assert client.get("/api/hello/").status_code == 200
        response = client.get("/api/hello/")
        assert response.status_code == 429


@pytest.mark.django_db
def test_axes_lockout_after_failed_admin_logins(django_client):
    from django.utils import timezone

    with override_settings(
        AXES_FAILURE_LIMIT=4,
        AXES_COOLOFF_TIME=timezone.timedelta(minutes=30),
    ):
        for _ in range(3):
            response = _post_admin_login(django_client, username="attacker", password="wrong")
            assert response.status_code in {200, 403}

        locked = _post_admin_login(django_client, username="attacker", password="wrong")
        assert locked.status_code in {403, 429}


def _post_admin_login(client, *, username: str, password: str):
    client.get("/admin/login/")
    csrf = client.cookies.get("csrftoken")
    token = csrf.value if csrf else ""
    return client.post(
        "/admin/login/",
        {
            "username": username,
            "password": password,
            "csrfmiddlewaretoken": token,
            "next": "/admin/",
        },
        follow=True,
    )


@pytest.mark.parametrize(
    ("origin",),
    [
        ("http://insecure.example.com",),
        ("http://127.0.0.1:8000",),
        ("http://backend",),
    ],
)
def test_prod_settings_reject_non_https_origins(origin):
    from django.core.exceptions import ImproperlyConfigured

    from config.settings.validators import validate_prod_origins

    with pytest.raises(ImproperlyConfigured, match="CORS_ALLOWED_ORIGINS"):
        validate_prod_origins("CORS_ALLOWED_ORIGINS", [origin])


def test_cors_credentials_enabled_for_admin_session_auth():
    from django.conf import settings

    assert settings.CORS_ALLOW_CREDENTIALS is True


def test_upload_size_limits_configured():
    from django.conf import settings

    assert settings.DATA_UPLOAD_MAX_MEMORY_SIZE == 2_621_440
    assert settings.DATA_UPLOAD_MAX_NUMBER_FIELDS == 1000
