#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"

COMPOSE_FILE="infra/docker/compose/docker-compose.dev.yml"

require_docker
require_env_file "infra/env/dev/.env" "copy infra/env/dev/.env.example first."
require_compose_service "$COMPOSE_FILE" backend dev-up

log_info "Running database migrations..."
docker compose --project-directory "$ROOT" -f "$COMPOSE_FILE" exec backend python manage.py migrate
log_success "Database migrations completed."
