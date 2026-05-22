import os

from django.utils import timezone


def _env_bool(name: str, default: str = "false") -> bool:
    return os.environ.get(name, default).lower() in {"1", "true", "yes"}


# Request body / field limits (Nginx body size: CLIENT_MAX_BODY_SIZE).
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get("DATA_UPLOAD_MAX_BYTES", "2621440"))
DATA_UPLOAD_MAX_NUMBER_FIELDS = int(os.environ.get("DATA_UPLOAD_MAX_FIELDS", "1000"))

# CORS — explicit origins; credentials enabled for admin session auth (main app still
# uses withCredentials: false and does not send cookies).
CORS_ALLOW_CREDENTIALS = _env_bool("CORS_ALLOW_CREDENTIALS", "true")
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# django-axes (admin brute-force protection)
AXES_FAILURE_LIMIT = int(os.environ.get("AXES_FAILURE_LIMIT", "5"))
AXES_COOLOFF_TIME = timezone.timedelta(minutes=float(os.environ.get("AXES_COOLOFF_MINUTES", "30")))
AXES_LOCKOUT_PARAMETERS = ["ip_address", "username"]
AXES_ONLY_ADMIN_SITE = True
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_TEMPLATE = None
AXES_LOCKOUT_URL = None
AXES_ENABLE_ACCESS_FAILURE_LOG = False
AXES_CACHE = "default"

# DRF throttling (uses Redis cache backend from base.py)
DRF_THROTTLE_RATES = {
    "anon": os.environ.get("DRF_THROTTLE_ANON", "100/hour"),
    "api": os.environ.get("DRF_THROTTLE_API", "200/hour"),
    "admin_login": os.environ.get("DRF_THROTTLE_ADMIN_LOGIN", "10/minute"),
}

# django-csp (Django admin and other HTML responses; API JSON excluded)
_csp_report_only = _env_bool("CSP_REPORT_ONLY")
_csp_report_uri = os.environ.get("CSP_REPORT_URI", "").strip()

_csp_directives = {
    "default-src": ("'self'",),
    "script-src": ("'self'",),
    "style-src": ("'self'", "'unsafe-inline'"),
    "img-src": ("'self'", "data:"),
    "font-src": ("'self'",),
    "connect-src": ("'self'",),
    "frame-ancestors": ("'none'",),
    "base-uri": ("'self'",),
    "form-action": ("'self'",),
}

if _csp_report_uri:
    _csp_directives["report-uri"] = (_csp_report_uri,)

_csp_policy = {
    "EXCLUDE_URL_PREFIXES": ("/api/",),
    "DIRECTIVES": _csp_directives,
}

if _csp_report_only:
    CONTENT_SECURITY_POLICY_REPORT_ONLY = _csp_policy
else:
    CONTENT_SECURITY_POLICY = _csp_policy
