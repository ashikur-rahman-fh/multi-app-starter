from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db.utils import OperationalError


@pytest.fixture(autouse=True)
def _clear_cache():
    """Override conftest cache clear — these tests do not require Redis."""
    yield


def test_wait_for_db_times_out():
    with (
        patch(
            "api.management.commands.wait_for_db.connection.ensure_connection",
            side_effect=OperationalError("connection failed"),
        ),
        pytest.raises(CommandError, match="timed out"),
    ):
        call_command("wait_for_db", timeout=1, interval=0.1)


@pytest.mark.integration
@pytest.mark.django_db
def test_wait_for_db_succeeds():
    call_command("wait_for_db", timeout=30, interval=1)
