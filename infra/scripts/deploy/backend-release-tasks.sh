#!/usr/bin/env bash
# One-off production Django release steps before restarting the backend service.
# Run migrate and collectstatic via compose run (not from Gunicorn workers).
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# When sourced from vm-deploy, load-deploy-env is already sourced.
if [[ -z "${DEPLOY_PATH:-}" ]]; then
  # shellcheck source=load-deploy-env.sh
  source "${_SCRIPT_DIR}/load-deploy-env.sh"
fi

ROOT="${DEPLOY_PATH:-$(cd "${_SCRIPT_DIR}/../../.." && pwd)}"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/compose/docker-compose.prod.yml}"
COMPOSE_DEPLOY_FILE="${COMPOSE_DEPLOY_FILE:-infra/docker/compose/docker-compose.deploy.yml}"
ENV_FILE="${ENV_FILE:-infra/env/prod/.env}"

compose() {
  local -a args=(
    docker compose
    --project-directory "$ROOT"
    --env-file "$ENV_FILE"
    -f "$COMPOSE_FILE"
  )
  if [[ -n "${BACKEND_IMAGE:-}" ]]; then
    args+=(-f "$COMPOSE_DEPLOY_FILE")
  fi
  "${args[@]}" "$@"
}

# shellcheck source=../lib/backend-django-prod.sh
source "${_SCRIPT_DIR}/../lib/backend-django-prod.sh"

backend_release_tasks
