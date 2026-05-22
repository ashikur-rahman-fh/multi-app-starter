import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from api.admin.constants import (
    ADMIN_FORBIDDEN_CODE,
    FORBIDDEN_USER_RESPONSE_KEYS,
    INVALID_CURRENT_PASSWORD_CODE,
    INVALID_CURRENT_PASSWORD_MESSAGE,
    SAFE_USER_RESPONSE_KEYS,
    WEAK_PASSWORD_CODE,
    WEAK_PASSWORD_MESSAGE,
)
from tests.test_admin_auth import (
    ME_URL,
    _assert_safe_user_payload,
    _authenticated_get,
    _create_regular_user,
    _create_superuser,
    _fetch_csrf,
    _login,
)
from tests.test_api import assert_error_envelope

User = get_user_model()

pytestmark = pytest.mark.django_db

CHANGE_PASSWORD_URL = "/api/admin/auth/change-password/"


def _authenticated_patch(client: APIClient, url: str, data):
    token = _fetch_csrf(client)
    return client.patch(url, data, format="json", HTTP_X_CSRFTOKEN=token)


def _authenticated_change_password(client: APIClient, data):
    token = _fetch_csrf(client)
    return client.post(CHANGE_PASSWORD_URL, data, format="json", HTTP_X_CSRFTOKEN=token)


def test_patch_profile_updates_safe_fields(api_client):
    user = _create_superuser(first_name="Old", last_name="Name", email="old@example.com")
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_patch(
        api_client,
        ME_URL,
        {"firstName": "New", "lastName": "Person", "email": "new@example.com"},
    )
    assert response.status_code == 200
    user.refresh_from_db()
    _assert_safe_user_payload(response.json(), user)
    assert response.json()["firstName"] == "New"
    assert response.json()["lastName"] == "Person"
    assert response.json()["email"] == "new@example.com"


def test_patch_profile_unauthenticated(api_client):
    response = api_client.patch(ME_URL, {"email": "x@example.com"}, format="json")
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_patch_profile_non_superuser_forbidden(api_client):
    user = _create_regular_user()
    api_client.force_login(user)
    response = api_client.patch(ME_URL, {"email": "x@example.com"}, format="json")
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_patch_profile_rejects_privileged_fields(api_client):
    _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    response = _authenticated_patch(api_client, ME_URL, {"isStaff": False, "isSuperuser": False})
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_patch_profile_invalid_email(api_client):
    _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    response = _authenticated_patch(api_client, ME_URL, {"email": "not-an-email"})
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_change_password_success(api_client):
    _create_superuser(password="CurrentPass123!")
    _login(api_client, username_or_email="admin", password="CurrentPass123!")

    response = _authenticated_change_password(
        api_client,
        {
            "currentPassword": "CurrentPass123!",
            "newPassword": "BrandNewPass123!",
            "confirmPassword": "BrandNewPass123!",
        },
    )
    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert "password" not in response.json()

    user = User.objects.get(username="admin")
    assert user.check_password("BrandNewPass123!")
    assert not user.check_password("CurrentPass123!")

    me_response = _authenticated_get(api_client, ME_URL)
    assert me_response.status_code == 200


def test_change_password_wrong_current(api_client):
    _create_superuser(password="CurrentPass123!")
    _login(api_client, username_or_email="admin", password="CurrentPass123!")

    response = _authenticated_change_password(
        api_client,
        {
            "currentPassword": "wrong",
            "newPassword": "BrandNewPass123!",
            "confirmPassword": "BrandNewPass123!",
        },
    )
    assert_error_envelope(response, status_code=400, code=INVALID_CURRENT_PASSWORD_CODE)
    assert response.json()["error"]["message"] == INVALID_CURRENT_PASSWORD_MESSAGE


def test_change_password_mismatch(api_client):
    _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_change_password(
        api_client,
        {
            "currentPassword": "adminpass123",
            "newPassword": "BrandNewPass123!",
            "confirmPassword": "DifferentPass123!",
        },
    )
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_change_password_weak_password(api_client):
    _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_change_password(
        api_client,
        {
            "currentPassword": "adminpass123",
            "newPassword": "123",
            "confirmPassword": "123",
        },
    )
    assert_error_envelope(response, status_code=400, code=WEAK_PASSWORD_CODE)
    assert response.json()["error"]["message"] == WEAK_PASSWORD_MESSAGE


def test_change_password_unauthenticated(api_client):
    response = api_client.post(
        CHANGE_PASSWORD_URL,
        {
            "currentPassword": "a",
            "newPassword": "BrandNewPass123!",
            "confirmPassword": "BrandNewPass123!",
        },
        format="json",
    )
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_me_includes_first_and_last_name(api_client):
    user = _create_superuser(first_name="Ada", last_name="Admin")
    _login(api_client, username_or_email="admin", password="adminpass123")
    response = _authenticated_get(api_client, ME_URL)
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == SAFE_USER_RESPONSE_KEYS
    assert body["firstName"] == "Ada"
    assert body["lastName"] == "Admin"
    for key in FORBIDDEN_USER_RESPONSE_KEYS:
        assert key not in body
    _assert_safe_user_payload(body, user)
