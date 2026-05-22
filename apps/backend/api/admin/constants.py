INVALID_CREDENTIALS_MESSAGE = "Invalid login details. Please check your credentials and try again."
ADMIN_FORBIDDEN_MESSAGE = "You do not have permission to access the admin area."

INVALID_CREDENTIALS_CODE = "INVALID_CREDENTIALS"
ADMIN_FORBIDDEN_CODE = "ADMIN_FORBIDDEN"

SAFE_USER_RESPONSE_KEYS = frozenset(
    {
        "id",
        "name",
        "username",
        "email",
        "isStaff",
        "isSuperuser",
    }
)

FORBIDDEN_USER_RESPONSE_KEYS = frozenset(
    {
        "password",
        "last_login",
        "date_joined",
        "groups",
        "user_permissions",
        "is_active",
    }
)
