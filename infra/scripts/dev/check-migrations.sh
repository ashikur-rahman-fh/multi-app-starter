#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT/apps/backend"

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.dev}"

echo "==> Django system check"
python manage.py check

echo "==> Checking for missing migration files"
python manage.py makemigrations --check --dry-run

echo "==> Migration check passed"
