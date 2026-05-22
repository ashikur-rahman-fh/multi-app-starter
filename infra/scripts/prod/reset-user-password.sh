#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"
require_docker
COMPOSE_FILE="infra/docker/compose/docker-compose.prod.yml"
ENV_FILE="infra/env/prod/.env"
require_env_file "$ENV_FILE" "copy infra/env/prod/.env.example first."
require_compose_service "$COMPOSE_FILE" backend prod-up "$ENV_FILE"
docker compose \
  --project-directory "$ROOT" \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec backend python manage.py issue_temporary_password
