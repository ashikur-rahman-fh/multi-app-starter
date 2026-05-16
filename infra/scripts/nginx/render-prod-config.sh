#!/usr/bin/env bash
# Render production Nginx vhost config from infra/env/prod/.env (no sourcing — safe parse).
# Requires: envsubst (apt install gettext-base)
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/read-env-var.sh
source "${_SCRIPT_DIR}/../lib/read-env-var.sh"

ROOT="${DEPLOY_PATH:-$(cd "${_SCRIPT_DIR}/../../.." && pwd)}"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-infra/env/prod/.env}"
TEMPLATE="${NGINX_TEMPLATE:-infra/nginx/prod/conf.d/default.conf.template}"
OUTPUT="${NGINX_OUTPUT:-infra/nginx/prod/conf.d/default.conf}"

if [[ "$ENV_FILE" = /* ]]; then
  env_abs="$ENV_FILE"
else
  env_abs="${ROOT}/${ENV_FILE}"
fi

if [[ ! -f "$env_abs" ]]; then
  echo "::error::Missing env file: ${env_abs}" >&2
  exit 1
fi

if [[ ! -f "${ROOT}/${TEMPLATE}" ]]; then
  echo "::error::Missing Nginx template: ${ROOT}/${TEMPLATE}" >&2
  exit 1
fi

if ! command -v envsubst >/dev/null 2>&1; then
  echo "::error::envsubst not found. Install gettext (e.g. apt install gettext-base)." >&2
  exit 1
fi

MAIN_FRONTEND_HOST="$(read_env_var_from_file "$env_abs" MAIN_FRONTEND_HOST)"
ADMIN_FRONTEND_HOST="$(read_env_var_from_file "$env_abs" ADMIN_FRONTEND_HOST)"
API_HOST="$(read_env_var_from_file "$env_abs" API_HOST)"
MAIN_FRONTEND_WWW_HOST="$(read_env_var_from_file "$env_abs" MAIN_FRONTEND_WWW_HOST)"
CLIENT_MAX_BODY_SIZE="$(read_env_var_from_file "$env_abs" CLIENT_MAX_BODY_SIZE)"

if [[ -z "$MAIN_FRONTEND_HOST" || -z "$ADMIN_FRONTEND_HOST" || -z "$API_HOST" ]]; then
  echo "::error::Set MAIN_FRONTEND_HOST, ADMIN_FRONTEND_HOST, and API_HOST in ${env_abs}" >&2
  exit 1
fi

if [[ -z "$MAIN_FRONTEND_WWW_HOST" ]]; then
  MAIN_FRONTEND_WWW_HOST="www.${MAIN_FRONTEND_HOST}"
fi

if [[ -z "$CLIENT_MAX_BODY_SIZE" ]]; then
  CLIENT_MAX_BODY_SIZE="25m"
fi

export MAIN_FRONTEND_HOST MAIN_FRONTEND_WWW_HOST ADMIN_FRONTEND_HOST API_HOST CLIENT_MAX_BODY_SIZE

tmp="${ROOT}/${OUTPUT}.tmp.$$"
envsubst '${MAIN_FRONTEND_HOST} ${MAIN_FRONTEND_WWW_HOST} ${ADMIN_FRONTEND_HOST} ${API_HOST} ${CLIENT_MAX_BODY_SIZE}' \
  < "${ROOT}/${TEMPLATE}" > "$tmp"
mv "$tmp" "${ROOT}/${OUTPUT}"

echo "==> Wrote ${OUTPUT}"
echo "    main:  ${MAIN_FRONTEND_HOST} ${MAIN_FRONTEND_WWW_HOST}"
echo "    admin: ${ADMIN_FRONTEND_HOST}"
echo "    api:   ${API_HOST}"
