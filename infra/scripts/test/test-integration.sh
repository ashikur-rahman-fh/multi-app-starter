#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
[[ -f infra/env/test/.env ]] || { echo "Missing infra/env/test/.env" >&2; exit 1; }
docker compose --project-directory "$ROOT" -f infra/docker/compose/docker-compose.test.yml run --rm test-runner bash -lc "cd /workspace/apps/backend && pytest -m integration -v --tb=short"
