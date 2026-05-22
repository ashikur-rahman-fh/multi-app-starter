#!/usr/bin/env bash
# Shared dev startup: wait for DB, validate migrations, apply, then hand off to runserver/debugpy.
set -euo pipefail

echo "[backend] Waiting for database..."
python manage.py wait_for_db

echo "[backend] Checking for missing migration files..."
if ! python manage.py makemigrations --check --dry-run; then
  echo "[backend] Model changes need migration files. Run: make backend-makemigrations" >&2
  exit 1
fi

echo "[backend] Checking migrations..."
python manage.py showmigrations --plan

echo "[backend] Applying migrations..."
python manage.py migrate --noinput
echo "[backend] Migrations completed."
