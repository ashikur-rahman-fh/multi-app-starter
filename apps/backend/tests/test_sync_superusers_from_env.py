import json

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError

User = get_user_model()

pytestmark = pytest.mark.django_db


def _superusers_json(entries):
    return json.dumps(entries)


def test_creates_new_superuser_from_env(monkeypatch):
    monkeypatch.setenv(
        "ADMIN_SUPERUSERS",
        _superusers_json(
            [
                {
                    "username": "envadmin",
                    "email": "env@example.com",
                    "password": "EnvAdminPass123!",
                    "first_name": "Env",
                    "last_name": "Admin",
                }
            ]
        ),
    )
    monkeypatch.delenv("ADMIN_SUPERUSER_UPDATE_PASSWORD", raising=False)

    call_command("sync_superusers_from_env")

    user = User.objects.get(username="envadmin")
    assert user.is_superuser is True
    assert user.is_staff is True
    assert user.is_active is True
    assert user.email == "env@example.com"
    assert user.first_name == "Env"
    assert user.last_name == "Admin"
    assert user.check_password("EnvAdminPass123!")


def test_does_not_duplicate_existing_user(monkeypatch):
    User.objects.create_user(
        username="existing",
        password="OriginalPass123!",
        email="old@example.com",
        is_superuser=True,
        is_staff=True,
    )
    monkeypatch.setenv(
        "ADMIN_SUPERUSERS",
        _superusers_json(
            [{"username": "existing", "email": "new@example.com", "password": "NewPass123!"}]
        ),
    )
    monkeypatch.setenv("ADMIN_SUPERUSER_UPDATE_PASSWORD", "false")

    call_command("sync_superusers_from_env")

    assert User.objects.filter(username="existing").count() == 1
    user = User.objects.get(username="existing")
    assert user.email == "new@example.com"
    assert user.check_password("OriginalPass123!")


def test_updates_password_when_flag_enabled(monkeypatch):
    User.objects.create_user(
        username="existing",
        password="OriginalPass123!",
        is_superuser=True,
        is_staff=True,
    )
    monkeypatch.setenv(
        "ADMIN_SUPERUSERS",
        _superusers_json(
            [{"username": "existing", "password": "UpdatedPass123!", "email": "a@example.com"}]
        ),
    )
    monkeypatch.setenv("ADMIN_SUPERUSER_UPDATE_PASSWORD", "true")

    call_command("sync_superusers_from_env")

    user = User.objects.get(username="existing")
    assert user.check_password("UpdatedPass123!")


def test_fails_on_invalid_json(monkeypatch):
    monkeypatch.setenv("ADMIN_SUPERUSERS", "not-json")
    with pytest.raises(CommandError, match="valid JSON"):
        call_command("sync_superusers_from_env")


def test_fails_when_password_missing_for_new_user(monkeypatch):
    monkeypatch.setenv(
        "ADMIN_SUPERUSERS",
        _superusers_json([{"username": "newbie", "email": "n@example.com"}]),
    )
    with pytest.raises(CommandError, match="Password is required"):
        call_command("sync_superusers_from_env")


def test_command_output_never_contains_password(monkeypatch, capsys):
    secret = "SecretPass123!"
    monkeypatch.setenv(
        "ADMIN_SUPERUSERS",
        _superusers_json([{"username": "quiet", "email": "q@example.com", "password": secret}]),
    )
    call_command("sync_superusers_from_env")
    captured = capsys.readouterr()
    assert secret not in captured.out
    assert secret not in captured.err
