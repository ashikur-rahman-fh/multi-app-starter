from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


def display_name_for_user(user) -> str:
    full_name = user.get_full_name().strip()
    return full_name if full_name else user.username


def serialize_admin_user(user) -> dict:
    return {
        "id": user.pk,
        "name": display_name_for_user(user),
        "username": user.username,
        "email": user.email or "",
        "isStaff": user.is_staff,
        "isSuperuser": user.is_superuser,
    }


class AdminLoginSerializer(serializers.Serializer):
    usernameOrEmail = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)
    password = serializers.CharField(
        required=True, allow_blank=False, write_only=True, trim_whitespace=False
    )


def resolve_username(username_or_email: str) -> str:
    identifier = username_or_email.strip()
    if "@" not in identifier:
        return identifier
    user = User.objects.filter(email__iexact=identifier).only("username").first()
    return user.username if user else identifier
