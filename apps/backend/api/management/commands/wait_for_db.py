import time

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.utils import OperationalError


class Command(BaseCommand):
    help = "Wait until the default database accepts connections."

    def add_arguments(self, parser):
        parser.add_argument(
            "--timeout",
            type=int,
            default=60,
            help="Maximum seconds to wait (default: 60).",
        )
        parser.add_argument(
            "--interval",
            type=float,
            default=2.0,
            help="Seconds between connection attempts (default: 2).",
        )

    def handle(self, *args, **options):
        timeout = options["timeout"]
        interval = options["interval"]
        deadline = time.monotonic() + timeout
        last_error: Exception | None = None

        self.stdout.write("[backend] Waiting for database...")

        while time.monotonic() < deadline:
            try:
                connection.ensure_connection()
                self.stdout.write(self.style.SUCCESS("[backend] Database is ready."))
                return
            except OperationalError as exc:
                last_error = exc
                time.sleep(interval)

        self.stderr.write(
            "[backend] Database not ready after "
            f"{timeout}s. Check POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, "
            "and that the postgres service is healthy."
        )
        if last_error is not None:
            self.stderr.write(f"[backend] Last error: {last_error}")
        raise CommandError("Database connection timed out.")
