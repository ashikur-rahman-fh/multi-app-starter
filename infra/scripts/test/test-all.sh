#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

if [[ ! -f infra/env/test/.env ]]; then
  echo "Missing infra/env/test/.env — copy infra/env/test/.env.example first." >&2
  exit 1
fi

COMPOSE=(docker compose --project-directory "$ROOT" -f infra/docker/compose/docker-compose.test.yml)

cleanup() {
  "${COMPOSE[@]}" down --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

"${COMPOSE[@]}" up --build -d postgres-test redis-test

ready=0
for _ in $(seq 1 120); do
  if "${COMPOSE[@]}" exec -T postgres-test sh -c 'pg_isready -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
    && "${COMPOSE[@]}" exec -T redis-test redis-cli ping >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "$ready" -ne 1 ]]; then
  echo "Postgres or Redis did not become ready in time." >&2
  exit 1
fi

set +e
"${COMPOSE[@]}" run --rm --build --no-deps test-runner
exit_code=$?
set -e
exit "$exit_code"
