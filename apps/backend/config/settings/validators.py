from django.core.exceptions import ImproperlyConfigured


def validate_prod_origins(name: str, origins: list[str]) -> None:
    if not origins:
        raise ImproperlyConfigured(f"{name} must be set in production.")
    for origin in origins:
        if origin.startswith("https://"):
            continue
        raise ImproperlyConfigured(
            f"{name} must use https:// origins in production (got {origin!r}). "
            f"Internal health checks use ALLOWED_HOSTS / HEALTH_CHECK_HTTP_HOST, not {name}."
        )
