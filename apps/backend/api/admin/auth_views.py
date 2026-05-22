from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
    update_session_auth_hash,
)
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .authentication import AdminSessionAuthentication
from .exceptions import AdminForbidden, AdminUnauthenticated, InvalidAdminCredentials
from .permissions import is_authorized_admin_user
from .serializers import (
    AdminChangePasswordSerializer,
    AdminLoginSerializer,
    AdminProfileUpdateSerializer,
    resolve_username,
    serialize_admin_user,
)

User = get_user_model()

SESSION_AUTH = [AdminSessionAuthentication]


def _require_authorized_admin(request):
    if not request.user.is_authenticated:
        raise AdminUnauthenticated()
    if not is_authorized_admin_user(request.user):
        raise AdminForbidden()


def _authenticate_admin_credentials(request, username_or_email: str, password: str):
    username = resolve_username(username_or_email)
    user = authenticate(request=request, username=username, password=password)
    if user is None:
        raise InvalidAdminCredentials()
    if not is_authorized_admin_user(user):
        raise InvalidAdminCredentials()
    return user


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def admin_csrf(request):
    return Response({"csrfToken": get_token(request)})


class AdminLoginThrottle(ScopedRateThrottle):
    scope = "admin_login"


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AdminLoginThrottle])
def admin_login(request):
    serializer = AdminLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = _authenticate_admin_credentials(
        request,
        serializer.validated_data["usernameOrEmail"],
        serializer.validated_data["password"],
    )
    login(request, user)
    return Response(serialize_admin_user(user))


@api_view(["POST"])
@authentication_classes(SESSION_AUTH)
@permission_classes([AllowAny])
def admin_logout(request):
    logout(request)
    return Response({"success": True})


@api_view(["GET", "PATCH"])
@authentication_classes(SESSION_AUTH)
@permission_classes([AllowAny])
def admin_me(request):
    _require_authorized_admin(request)
    user = request.user
    if request.method == "GET":
        return Response(serialize_admin_user(user))

    serializer = AdminProfileUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.update(user, serializer.validated_data)
    user.refresh_from_db()
    return Response(serialize_admin_user(user))


@api_view(["POST"])
@authentication_classes(SESSION_AUTH)
@permission_classes([AllowAny])
def admin_change_password(request):
    _require_authorized_admin(request)
    serializer = AdminChangePasswordSerializer(
        data=request.data,
        context={"user": request.user},
    )
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    update_session_auth_hash(request, user)
    return Response({"success": True})
