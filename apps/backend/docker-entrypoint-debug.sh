#!/usr/bin/env bash
set -euo pipefail
python manage.py migrate --noinput
if [[ "${WAIT_FOR_DEBUGGER:-false}" == "true" ]]; then
  exec python -m debugpy --listen 0.0.0.0:5678 --wait-for-client manage.py runserver 0.0.0.0:8000
else
  exec python -m debugpy --listen 0.0.0.0:5678 manage.py runserver 0.0.0.0:8000
fi
