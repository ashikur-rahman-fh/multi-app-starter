#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"

COMPOSE_FILE="infra/docker/compose/docker-compose.dev.yml"

require_docker
require_env_file "infra/env/dev/.env" "copy infra/env/dev/.env.example first."
require_compose_service "$COMPOSE_FILE" postgres dev-up

mkdir -p "${ROOT}/infra/scripts/db/backups"
TS=$(date +%Y%m%d%H%M%S)
OUTPUT="${ROOT}/infra/scripts/db/backups/dump-${TS}.sql"

log_info "Backing up database via postgres service..."
docker compose --project-directory "$ROOT" -f "$COMPOSE_FILE" exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$OUTPUT"
log_success "Wrote ${OUTPUT}"
