from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .constants import PROFILE_FORBIDDEN_WRITE_KEYS
from .exceptions import InvalidCurrentPassword, WeakPassword

User = get_user_model()


def display_name_for_user(user) -> str:
    full_name = user.get_full_name().strip()
    return full_name if full_name else user.username


def serialize_admin_user(user) -> dict:
    return {
        "id": user.pk,
        "name": display_name_for_user(user),
        "firstName": user.first_name or "",
        "lastName": user.last_name or "",
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


class AdminProfileUpdateSerializer(serializers.Serializer):
    firstName = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    lastName = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    email = serializers.EmailField(required=False, allow_blank=False, trim_whitespace=True)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one profile field must be provided.")
        return attrs

    def validate_email(self, value):
        if value is not None and not value.strip():
            raise serializers.ValidationError("Email must not be empty.")
        return value

    def to_internal_value(self, data):
        if isinstance(data, dict):
            forbidden = PROFILE_FORBIDDEN_WRITE_KEYS.intersection(data.keys())
            if forbidden:
                raise serializers.ValidationError(
                    {key: "This field cannot be updated." for key in sorted(forbidden)}
                )
        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        if "firstName" in validated_data:
            instance.first_name = validated_data["firstName"]
        if "lastName" in validated_data:
            instance.last_name = validated_data["lastName"]
        if "email" in validated_data:
            instance.email = validated_data["email"]
        instance.save()
        return instance


class AdminChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(
        required=True, allow_blank=False, write_only=True, trim_whitespace=False
    )
    newPassword = serializers.CharField(
        required=True, allow_blank=False, write_only=True, trim_whitespace=False
    )
    confirmPassword = serializers.CharField(
        required=True, allow_blank=False, write_only=True, trim_whitespace=False
    )

    def validate(self, attrs):
        if attrs["newPassword"] != attrs["confirmPassword"]:
            raise serializers.ValidationError(
                {"confirmPassword": ["New password and confirmation do not match."]}
            )
        return attrs

    def validate_newPassword(self, value):
        user = self.context.get("user")
        try:
            validate_password(value, user=user)
        except DjangoValidationError:
            raise WeakPassword() from None
        return value

    def save(self, **kwargs):
        user = self.context["user"]
        if not user.check_password(self.validated_data["currentPassword"]):
            raise InvalidCurrentPassword()
        user.set_password(self.validated_data["newPassword"])
        user.save(update_fields=["password"])
        return user
