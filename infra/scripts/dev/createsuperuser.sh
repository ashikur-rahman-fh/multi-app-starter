#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
docker compose --project-directory "$ROOT" -f infra/docker/compose/docker-compose.dev.yml exec backend python manage.py createsuperuser
