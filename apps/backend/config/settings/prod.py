import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403


def require_secret(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value or value.startswith("change-me"):
        raise ImproperlyConfigured(
            f"{name} must be set to a real production value. "
            f"Set {name} in infra/env/prod/.env or the deployment environment. "
            'Values starting with "change-me" are rejected.'
        )
    return value


DEBUG = False

SECRET_KEY = require_secret("SECRET_KEY")

DATABASES["default"]["PASSWORD"] = require_secret("POSTGRES_PASSWORD")  # noqa: F405

# TLS is terminated at Nginx; Django sits behind the reverse proxy.
SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
