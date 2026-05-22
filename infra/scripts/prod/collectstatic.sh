#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"

COMPOSE_FILE="infra/docker/compose/docker-compose.prod.yml"
ENV_FILE="infra/env/prod/.env"

require_docker
require_env_file "$ENV_FILE" "copy infra/env/prod/.env.example first."
require_compose_service "$COMPOSE_FILE" backend prod-up "$ENV_FILE"

compose() {
  docker compose \
    --project-directory "$ROOT" \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    "$@"
}

# shellcheck source=infra/scripts/lib/backend-django-prod.sh
source "${ROOT}/infra/scripts/lib/backend-django-prod.sh"

backend_compose_run() {
  compose exec -T backend "$@"
}

log_info "Collecting production static files..."
backend_release_collectstatic
log_success "Production static files collected."
