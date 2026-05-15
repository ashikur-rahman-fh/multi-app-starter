#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"

COMPOSE_FILE="infra/docker/compose/docker-compose.prod.yml"

require_docker
require_env_file "infra/env/prod/.env" "copy infra/env/prod/.env.example first."
require_compose_service "$COMPOSE_FILE" backend prod-up infra/env/prod/.env

log_info "Running production database migrations..."
docker compose \
  --project-directory "$ROOT" \
  --env-file infra/env/prod/.env \
  -f "$COMPOSE_FILE" \
  exec backend python manage.py migrate
log_success "Production database migrations completed."
