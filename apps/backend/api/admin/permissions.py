from rest_framework.permissions import BasePermission


def is_authorized_admin_user(user) -> bool:
    return bool(user and user.is_authenticated and user.is_active and user.is_superuser)


class IsActiveSuperuser(BasePermission):
    """Allow only authenticated, active Django superusers."""

    message = "You do not have permission to access the admin area."

    def has_permission(self, request, view):
        return is_authorized_admin_user(request.user)
