#!/usr/bin/env bash
# Load registry-deploy settings from infra/env/prod/.env (safe parse; never source .env).
# Exports only variables not already set in the environment (GitHub SSH deploy keeps precedence).
# Intended to be sourced from vm-deploy.sh.
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/read-env-var.sh
source "${_SCRIPT_DIR}/../lib/read-env-var.sh"

_DEFAULT_ROOT="$(cd "${_SCRIPT_DIR}/../../.." && pwd)"

ENV_FILE="${ENV_FILE:-infra/env/prod/.env}"
DEPLOY_PATH="${DEPLOY_PATH:-${_DEFAULT_ROOT}}"

if [[ "$ENV_FILE" = /* ]]; then
  _env_abs="$ENV_FILE"
else
  _env_abs="${DEPLOY_PATH}/${ENV_FILE}"
fi

read_env_var() {
  read_env_var_from_file "$_env_abs" "$1"
}

set_if_empty() {
  local name="$1"
  local value="$2"
  if [[ -z "${!name:-}" && -n "$value" ]]; then
    export "$name=$value"
  fi
}

if [[ -f "$_env_abs" ]]; then
  set_if_empty DOCKER_REPO "$(read_env_var DOCKER_REPO)"
  set_if_empty BRANCH_SLUG "$(read_env_var BRANCH_SLUG)"
  set_if_empty DOCKER_USERNAME "$(read_env_var DOCKER_USERNAME)"
  set_if_empty DOCKER_TOKEN "$(read_env_var DOCKER_TOKEN)"
  set_if_empty DOCKER_PASSWORD "$(read_env_var DOCKER_PASSWORD)"
  set_if_empty BACKUP_DIR "$(read_env_var BACKUP_DIR)"
  set_if_empty APP_DOMAIN "$(read_env_var APP_DOMAIN)"
  set_if_empty API_HOST "$(read_env_var API_HOST)"
  set_if_empty DEPLOY_PATH "$(read_env_var DEPLOY_PATH)"
  set_if_empty COMPOSE_FILE "$(read_env_var COMPOSE_FILE)"
  set_if_empty COMPOSE_DEPLOY_FILE "$(read_env_var COMPOSE_DEPLOY_FILE)"
  set_if_empty COMPOSE_PROJECT_NAME "$(read_env_var COMPOSE_PROJECT_NAME)"
  set_if_empty GIT_REF "$(read_env_var GIT_REF)"
  set_if_empty SKIP_GIT_SYNC "$(read_env_var SKIP_GIT_SYNC)"
  set_if_empty DB_SERVICE_NAME "$(read_env_var DB_SERVICE_NAME)"
  set_if_empty DB_BACKUP_COMMAND "$(read_env_var DB_BACKUP_COMMAND)"
  set_if_empty HEALTH_CHECK_HTTP_HOST "$(read_env_var HEALTH_CHECK_HTTP_HOST)"
  set_if_empty HEALTH_CHECK_PATH "$(read_env_var HEALTH_CHECK_PATH)"
fi

# APP_DOMAIN and health-check Host default to API hostname from .env
if [[ -z "${APP_DOMAIN:-}" && -n "${API_HOST:-}" ]]; then
  export APP_DOMAIN="$API_HOST"
fi
if [[ -z "${HEALTH_CHECK_HTTP_HOST:-}" ]]; then
  export HEALTH_CHECK_HTTP_HOST="${API_HOST:-backend}"
fi
export HEALTH_CHECK_PATH="${HEALTH_CHECK_PATH:-/api/health/}"

export DEPLOY_PATH="${DEPLOY_PATH:-${_DEFAULT_ROOT}}"
export ENV_FILE
export COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/compose/docker-compose.prod.yml}"
export COMPOSE_DEPLOY_FILE="${COMPOSE_DEPLOY_FILE:-infra/docker/compose/docker-compose.deploy.yml}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-starter-prod}"

# Normalize registry password alias
if [[ -z "${DOCKER_PASSWORD:-}" && -n "${DOCKER_TOKEN:-}" ]]; then
  export DOCKER_PASSWORD="$DOCKER_TOKEN"
fi

_missing=()
for _key in DOCKER_REPO BRANCH_SLUG DOCKER_USERNAME; do
  if [[ -z "${!_key:-}" ]]; then
    _missing+=("$_key")
  fi
done
if [[ -z "${DOCKER_PASSWORD:-}" ]]; then
  _missing+=("DOCKER_TOKEN or DOCKER_PASSWORD")
fi

if [[ ${#_missing[@]} -gt 0 ]]; then
  echo "::error::Missing deploy configuration: ${_missing[*]}" >&2
  echo "::error::Set them in ${_env_abs} (see infra/env/prod/.env.example) or export before running." >&2
  if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    exit 1
  else
    return 1
  fi
fi
