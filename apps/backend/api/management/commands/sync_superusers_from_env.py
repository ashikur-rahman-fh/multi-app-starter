from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.admin.superuser_env import (
    load_superuser_specs_from_env,
    load_superuser_update_password_flag,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Create or update superuser accounts from ADMIN_SUPERUSERS environment variable."

    def handle(self, *args, **options):
        try:
            specs = load_superuser_specs_from_env()
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        update_password = load_superuser_update_password_flag()
        created = 0
        updated = 0

        with transaction.atomic():
            for spec in specs:
                user = User.objects.filter(username=spec.username).first()
                if user is None:
                    self._create_superuser(spec)
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f"Created superuser: {spec.username}"))
                else:
                    if self._update_superuser(user, spec, update_password):
                        updated += 1
                        self.stdout.write(self.style.SUCCESS(f"Updated superuser: {spec.username}"))
                    else:
                        self.stdout.write(f"No changes needed for superuser: {spec.username}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Superuser sync complete. created={created} updated={updated} total={len(specs)}"
            )
        )

    def _create_superuser(self, spec):
        if not spec.password:
            raise CommandError(
                f"Password is required to create new superuser '{spec.username}'. "
                "Set password in ADMIN_SUPERUSERS."
            )
        self._validate_password(spec.password, username=spec.username, email=spec.email)
        user = User.objects.create_user(
            username=spec.username,
            email=spec.email,
            password=spec.password,
            first_name=spec.first_name,
            last_name=spec.last_name,
        )
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=["is_active", "is_staff", "is_superuser"])

    def _update_superuser(self, user, spec, update_password: bool) -> bool:
        changed = False
        fields_to_update: list[str] = []

        if not user.is_active:
            user.is_active = True
            fields_to_update.append("is_active")
            changed = True
        if not user.is_staff:
            user.is_staff = True
            fields_to_update.append("is_staff")
            changed = True
        if not user.is_superuser:
            user.is_superuser = True
            fields_to_update.append("is_superuser")
            changed = True

        if spec.email and user.email != spec.email:
            user.email = spec.email
            fields_to_update.append("email")
            changed = True
        if spec.first_name and user.first_name != spec.first_name:
            user.first_name = spec.first_name
            fields_to_update.append("first_name")
            changed = True
        if spec.last_name and user.last_name != spec.last_name:
            user.last_name = spec.last_name
            fields_to_update.append("last_name")
            changed = True

        if update_password and spec.password:
            self._validate_password(
                spec.password,
                user=user,
                username=spec.username,
                email=spec.email or user.email,
            )
            user.set_password(spec.password)
            fields_to_update.append("password")
            changed = True

        if fields_to_update:
            user.save(update_fields=fields_to_update)
        return changed

    def _validate_password(self, password: str, *, username: str, email: str = "", user=None):
        if not password:
            raise CommandError("Password must not be empty.")
        if not settings.DEBUG and len(password) < 8:
            raise CommandError(
                "Password is too short for production. Use at least 8 characters "
                "or run with DEBUG=true in development only."
            )
        try:
            validate_password(password, user=user)
        except Exception as exc:
            raise CommandError(f"Password validation failed for '{username}': {exc}") from exc
