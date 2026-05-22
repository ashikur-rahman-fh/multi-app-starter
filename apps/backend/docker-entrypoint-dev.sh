#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=docker-entrypoint-dev-common.sh
source "$(dirname "$0")/docker-entrypoint-dev-common.sh"
echo "[backend] Starting development server..."
exec python manage.py runserver 0.0.0.0:8000
