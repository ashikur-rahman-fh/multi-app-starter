#!/usr/bin/env bash
# Run Django manage.py in dev, prod, or test Docker environments.
# Usage: run_backend_manage <dev|prod|test> <manage.py-args...>
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

run_backend_manage() {
  local env="${1:?Usage: run_backend_manage <dev|prod|test> <manage.py args>}"
  shift

  case "$env" in
    dev)
      _run_dev_manage "$@"
      ;;
    prod)
      _run_prod_manage "$@"
      ;;
    test)
      _run_test_manage "$@"
      ;;
    *)
      echo "Unknown environment: $env (expected dev, prod, or test)" >&2
      return 1
      ;;
  esac
}

_run_dev_manage() {
  # shellcheck source=infra/scripts/lib/preflight.sh
  source "${ROOT}/infra/scripts/lib/preflight.sh"
  require_docker
  local compose_file="infra/docker/compose/docker-compose.dev.yml"
  require_compose_service "$compose_file" backend dev-up

  docker compose \
    --project-directory "$ROOT" \
    -f "$compose_file" \
    exec backend python manage.py "$@"
}

_run_prod_manage() {
  # shellcheck source=infra/scripts/lib/preflight.sh
  source "${ROOT}/infra/scripts/lib/preflight.sh"
  require_docker
  local compose_file="infra/docker/compose/docker-compose.prod.yml"
  local env_file="infra/env/prod/.env"
  require_env_file "$env_file" "copy infra/env/prod/.env.example first."
  require_compose_service "$compose_file" backend prod-up "$env_file"

  docker compose \
    --project-directory "$ROOT" \
    --env-file "$env_file" \
    -f "$compose_file" \
    exec -T backend python manage.py "$@"
}

_run_test_manage() {
  # shellcheck source=infra/scripts/lib/preflight.sh
  source "${ROOT}/infra/scripts/lib/preflight.sh"
  require_docker
  local compose_file="infra/docker/compose/docker-compose.test.yml"
  local env_file="infra/env/test/.env"
  require_env_file "$env_file" "copy infra/env/test/.env.example first."

  local manage_cmd="cd /workspace/apps/backend && python manage.py wait_for_db && python manage.py"
  for arg in "$@"; do
    manage_cmd+=" $(printf '%q' "$arg")"
  done

  docker compose \
    --project-directory "$ROOT" \
    --env-file "$env_file" \
    -f "$compose_file" \
    run --rm test-runner bash -lc "$manage_cmd"
}
