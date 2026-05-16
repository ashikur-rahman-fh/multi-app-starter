#!/usr/bin/env bash
# Start admin Next dev in Docker and verify root routing via curl (see smoke-admin-root.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose --project-directory "$ROOT" -f infra/docker/compose/docker-compose.smoke.yml)

cleanup() {
  "${COMPOSE[@]}" down --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Admin root routing smoke (Docker Compose)"
"${COMPOSE[@]}" up --build --abort-on-container-exit --exit-code-from smoke-admin-root \
  frontend-admin smoke-admin-root
