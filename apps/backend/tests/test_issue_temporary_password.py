import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.management import call_command
from django.core.management.base import CommandError

User = get_user_model()

pytestmark = pytest.mark.django_db


def test_existing_user_receives_temporary_password(capsys):
    User.objects.create_user(username="opsuser", password="OldPass123!")

    call_command("issue_temporary_password", "--username", "opsuser", "--no-input")

    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().splitlines() if line]
    password_line = lines[1]
    assert len(password_line) >= 16

    user = User.objects.get(username="opsuser")
    assert user.check_password(password_line)
    assert not user.check_password("OldPass123!")


def test_unknown_username_does_not_create_user():
    with pytest.raises(CommandError, match="No user found"):
        call_command("issue_temporary_password", "--username", "missing", "--no-input")
    assert User.objects.filter(username="missing").count() == 0


def test_generated_password_is_strong_enough(monkeypatch):
    User.objects.create_user(username="strong", password="OldPass123!")

    def _always_reject(*_args, **_kwargs):
        raise DjangoValidationError("too weak")

    monkeypatch.setattr(
        "api.management.commands.issue_temporary_password.validate_password",
        _always_reject,
    )
    with pytest.raises(CommandError, match="Could not generate"):
        call_command("issue_temporary_password", "--username", "strong", "--no-input")
