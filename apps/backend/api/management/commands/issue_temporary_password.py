import secrets
import string

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()

# Exclude ambiguous characters for operator handoff.
_PASSWORD_ALPHABET = (
    string.ascii_letters.replace("O", "").replace("l", "")
    + string.digits.replace("0", "").replace("1", "")
    + "!@#$%^&*-_=+"
)
_PASSWORD_LENGTH = 20
_MAX_GENERATION_ATTEMPTS = 50


class Command(BaseCommand):
    help = "Issue a one-time temporary password for an existing user (interactive or --username)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            help="Username to reset (skips interactive prompt).",
        )
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Do not prompt for confirmation (requires --username).",
        )

    def handle(self, *args, **options):
        username = options.get("username")
        no_input = options.get("no_input")

        if not username:
            username = input("Username: ").strip()
        if not username:
            raise CommandError("Username is required.")

        user = User.objects.filter(username=username).only("id", "username").first()
        if user is None:
            raise CommandError(f"No user found with username '{username}'.")

        if not no_input:
            confirm = input(f"Type 'yes' to reset password for {username}: ").strip().lower()
            if confirm != "yes":
                self.stdout.write("Password reset cancelled.")
                return

        temporary_password = self._generate_valid_password(user)
        user.set_password(temporary_password)
        user.save(update_fields=["password"])

        self.stdout.write(self.style.WARNING(f"Temporary password issued for user: {username}"))
        self.stdout.write(temporary_password)
        self.stdout.write(
            "This temporary password is shown only once. Share it securely and instruct "
            "the user to change it after login."
        )

    def _generate_valid_password(self, user) -> str:
        for _ in range(_MAX_GENERATION_ATTEMPTS):
            candidate = "".join(secrets.choice(_PASSWORD_ALPHABET) for _ in range(_PASSWORD_LENGTH))
            try:
                validate_password(candidate, user=user)
            except Exception:
                continue
            return candidate
        raise CommandError("Could not generate a password that passes validation.")
