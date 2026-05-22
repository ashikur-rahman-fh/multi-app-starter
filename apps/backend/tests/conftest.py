import pytest
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def csrf_client():
    return APIClient(enforce_csrf_checks=True)


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()
