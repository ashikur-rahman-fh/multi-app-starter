import os

from django.utils import timezone

from .base import *  # noqa: F403

DEBUG = False

DATABASES["default"]["TEST"] = {  # noqa: F405
    "NAME": os.environ.get("POSTGRES_DB", "starter_test") + "_pytest",
}

# Avoid flaky lockouts during pytest; axes tests override limits explicitly.
AXES_FAILURE_LIMIT = 999
AXES_COOLOFF_TIME = timezone.timedelta(minutes=1)

# High throttle limits for most tests; throttle tests override per-case.
DRF_THROTTLE_RATES = {
    "anon": "10000/hour",
    "api": "10000/hour",
    "admin_login": "10000/hour",
}
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = DRF_THROTTLE_RATES  # noqa: F405

# Admin HTML tests need static URLs without a collectstatic manifest.
STORAGES = {
    **STORAGES,  # noqa: F405
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
