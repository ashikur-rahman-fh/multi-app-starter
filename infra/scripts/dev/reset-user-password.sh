#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"
require_docker
COMPOSE_FILE="infra/docker/compose/docker-compose.dev.yml"
require_compose_service "$COMPOSE_FILE" backend dev-up
docker compose --project-directory "$ROOT" -f "$COMPOSE_FILE" exec backend python manage.py issue_temporary_password
