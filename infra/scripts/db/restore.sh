#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"

COMPOSE_FILE="infra/docker/compose/docker-compose.dev.yml"
SERVICE="postgres"

if [[ $# -lt 1 ]]; then
  log_error "Usage: $0 <path-to-sql-dump>"
  exit 1
fi

DUMP="$1"

if [[ ! -f "$DUMP" ]]; then
  log_error "Backup file not found: ${DUMP}"
  exit 1
fi

if [[ ! -s "$DUMP" ]]; then
  log_error "Backup file is empty: ${DUMP}"
  exit 1
fi

require_docker
require_env_file "infra/env/dev/.env" "copy infra/env/dev/.env.example first."
require_compose_service "$COMPOSE_FILE" "$SERVICE" dev-up

log_info "Restoring database via ${SERVICE} service..."
if docker compose --project-directory "$ROOT" -f "$COMPOSE_FILE" exec -T "$SERVICE" \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$DUMP"; then
  log_success "Database restore completed for service ${SERVICE}."
else
  log_error "Database restore failed. Check the dump file and that the ${SERVICE} service is healthy."
  exit 1
fi
