import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from api.admin.constants import (
    ADMIN_FORBIDDEN_CODE,
    ADMIN_FORBIDDEN_MESSAGE,
    FORBIDDEN_USER_RESPONSE_KEYS,
    INVALID_CREDENTIALS_CODE,
    INVALID_CREDENTIALS_MESSAGE,
    SAFE_USER_RESPONSE_KEYS,
)
from tests.test_api import assert_error_envelope

User = get_user_model()

pytestmark = pytest.mark.django_db

LOGIN_URL = "/api/admin/auth/login/"
LOGOUT_URL = "/api/admin/auth/logout/"
ME_URL = "/api/admin/auth/me/"
CSRF_URL = "/api/admin/auth/csrf/"


def _create_superuser(username="admin", password="adminpass123", **kwargs):
    defaults = {
        "email": f"{username}@example.com",
        "is_superuser": True,
        "is_staff": True,
        "is_active": True,
    }
    defaults.update(kwargs)
    return User.objects.create_user(username=username, password=password, **defaults)


def _create_regular_user(username="user", password="userpass123", **kwargs):
    defaults = {"email": f"{username}@example.com", "is_active": True}
    defaults.update(kwargs)
    return User.objects.create_user(username=username, password=password, **defaults)


def _fetch_csrf(client: APIClient) -> str:
    response = client.get(CSRF_URL)
    assert response.status_code == 200
    assert "csrfToken" in response.json()
    return response.json()["csrfToken"]


def _login(
    client: APIClient,
    *,
    username_or_email: str,
    password: str,
    with_csrf: bool = False,
):
    headers = {}
    if with_csrf:
        token = _fetch_csrf(client)
        headers["HTTP_X_CSRFTOKEN"] = token
    return client.post(
        LOGIN_URL,
        {"usernameOrEmail": username_or_email, "password": password},
        format="json",
        **headers,
    )


def _authenticated_get(client: APIClient, url: str):
    token = _fetch_csrf(client)
    return client.get(url, HTTP_X_CSRFTOKEN=token)


def _authenticated_post(client: APIClient, url: str, data=None):
    token = _fetch_csrf(client)
    return client.post(url, data or {}, format="json", HTTP_X_CSRFTOKEN=token)


def _assert_safe_user_payload(body: dict, user: User):
    assert set(body.keys()) == SAFE_USER_RESPONSE_KEYS
    assert body["id"] == user.pk
    assert body["username"] == user.username
    assert body["email"] == (user.email or "")
    assert body["isStaff"] is user.is_staff
    assert body["isSuperuser"] is user.is_superuser
    assert isinstance(body["name"], str)
    assert body["name"]
    for key in FORBIDDEN_USER_RESPONSE_KEYS:
        assert key not in body


def test_csrf_endpoint_returns_token(api_client):
    response = api_client.get(CSRF_URL)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["csrfToken"], str)
    assert len(data["csrfToken"]) > 0


def test_login_success_active_superuser(api_client):
    user = _create_superuser()
    response = _login(api_client, username_or_email="admin", password="adminpass123")
    assert response.status_code == 200
    _assert_safe_user_payload(response.json(), user)


def test_login_success_with_email(api_client):
    user = _create_superuser(email="super@example.com")
    response = _login(
        api_client,
        username_or_email="super@example.com",
        password="adminpass123",
    )
    assert response.status_code == 200
    _assert_safe_user_payload(response.json(), user)


def test_login_invalid_credentials(api_client):
    _create_superuser()
    response = _login(api_client, username_or_email="admin", password="wrong")
    assert_error_envelope(response, status_code=401, code=INVALID_CREDENTIALS_CODE)
    assert response.json()["error"]["message"] == INVALID_CREDENTIALS_MESSAGE


def test_login_unknown_username_same_error(api_client):
    response = _login(api_client, username_or_email="nobody", password="secret")
    assert_error_envelope(response, status_code=401, code=INVALID_CREDENTIALS_CODE)
    assert response.json()["error"]["message"] == INVALID_CREDENTIALS_MESSAGE


def test_login_missing_username(api_client):
    response = api_client.post(LOGIN_URL, {"password": "x"}, format="json")
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_login_missing_password(api_client):
    response = api_client.post(LOGIN_URL, {"usernameOrEmail": "admin"}, format="json")
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_login_inactive_superuser(api_client):
    _create_superuser(is_active=False)
    response = _login(api_client, username_or_email="admin", password="adminpass123")
    assert_error_envelope(response, status_code=401, code=INVALID_CREDENTIALS_CODE)


def test_login_regular_user(api_client):
    _create_regular_user()
    response = _login(api_client, username_or_email="user", password="userpass123")
    assert_error_envelope(response, status_code=401, code=INVALID_CREDENTIALS_CODE)


def test_login_staff_non_superuser(api_client):
    User.objects.create_user(
        username="staff",
        password="staffpass123",
        email="staff@example.com",
        is_staff=True,
        is_superuser=False,
        is_active=True,
    )
    response = _login(api_client, username_or_email="staff", password="staffpass123")
    assert_error_envelope(response, status_code=401, code=INVALID_CREDENTIALS_CODE)


def test_me_returns_current_superuser(api_client):
    user = _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    response = _authenticated_get(api_client, ME_URL)
    assert response.status_code == 200
    _assert_safe_user_payload(response.json(), user)


def test_me_unauthenticated(api_client):
    response = api_client.get(ME_URL)
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_me_authenticated_non_superuser(api_client):
    user = _create_regular_user()
    api_client.force_login(user)
    response = api_client.get(ME_URL)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)
    assert response.json()["error"]["message"] == ADMIN_FORBIDDEN_MESSAGE


def test_me_authenticated_staff_non_superuser(api_client):
    user = User.objects.create_user(
        username="staff",
        password="staffpass123",
        is_staff=True,
        is_superuser=False,
        is_active=True,
    )
    api_client.force_login(user)
    response = api_client.get(ME_URL)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_logout_authenticated(api_client):
    _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    response = _authenticated_post(api_client, LOGOUT_URL)
    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert api_client.get(ME_URL).status_code == 401


def test_logout_already_logged_out(api_client):
    response = api_client.post(LOGOUT_URL)
    assert response.status_code == 200
    assert response.json() == {"success": True}


def test_login_never_returns_password_hash(api_client):
    _create_superuser()
    response = _login(api_client, username_or_email="admin", password="adminpass123")
    body = response.json()
    assert "password" not in body
    user = User.objects.get(username="admin")
    assert user.password not in str(body)


def test_login_with_csrf_enforced(csrf_client):
    _create_superuser()
    token = _fetch_csrf(csrf_client)
    response = csrf_client.post(
        LOGIN_URL,
        {"usernameOrEmail": "admin", "password": "adminpass123"},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )
    assert response.status_code == 200


def test_logout_without_csrf_fails_when_session_authenticated(csrf_client):
    _create_superuser()
    token = _fetch_csrf(csrf_client)
    csrf_client.post(
        LOGIN_URL,
        {"usernameOrEmail": "admin", "password": "adminpass123"},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )
    response = csrf_client.post(LOGOUT_URL, format="json")
    assert response.status_code == 403


def test_cors_allow_credentials_setting():
    from django.conf import settings

    assert settings.CORS_ALLOW_CREDENTIALS is True


def test_admin_login_throttle_scope_configured():
    from api.admin.auth_views import AdminLoginThrottle
    from config.settings.security import DRF_THROTTLE_RATES

    assert AdminLoginThrottle.scope == "admin_login"
    assert "admin_login" in DRF_THROTTLE_RATES
