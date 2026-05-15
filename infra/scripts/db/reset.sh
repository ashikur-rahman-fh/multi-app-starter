#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"

COMPOSE_FILE="infra/docker/compose/docker-compose.dev.yml"

require_docker

log_warning "This will delete local development database volumes and cannot be undone."

if [[ "${FORCE:-}" != "1" ]]; then
  read -r -p "Type 'yes' to continue: " confirm
  if [[ "$confirm" != "yes" ]]; then
    log_info "Aborted."
    exit 0
  fi
fi

log_info "Removing development stack and volumes..."
docker compose --project-directory "$ROOT" -f "$COMPOSE_FILE" down -v
log_success "Development database volumes removed."
