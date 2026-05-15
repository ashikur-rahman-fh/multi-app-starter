import pytest
from django.core.cache import cache
from django.db import connection

pytestmark = [pytest.mark.django_db, pytest.mark.integration]


def test_postgres_connection():
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        assert cursor.fetchone()[0] == 1


def test_redis_connection():
    cache.set("starter:integration", "ok", timeout=5)
    assert cache.get("starter:integration") == "ok"
