#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=docker-entrypoint-dev-common.sh
source "$(dirname "$0")/docker-entrypoint-dev-common.sh"
echo "[backend] Starting debug server (debugpy on :5678)..."
if [[ "${WAIT_FOR_DEBUGGER:-false}" == "true" ]]; then
  exec python -m debugpy --listen 0.0.0.0:5678 --wait-for-client manage.py runserver 0.0.0.0:8000
else
  exec python -m debugpy --listen 0.0.0.0:5678 manage.py runserver 0.0.0.0:8000
fi
