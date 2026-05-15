#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"

require_docker
require_env_file "infra/env/dev/.env" "copy infra/env/dev/.env.example first."

log_info "Starting development stack..."
docker compose --project-directory "$ROOT" -f infra/docker/compose/docker-compose.dev.yml up --build -d
log_success "Development stack is running."
