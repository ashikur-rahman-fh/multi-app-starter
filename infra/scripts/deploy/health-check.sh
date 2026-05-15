#!/usr/bin/env bash
# Post-deploy health checks. Exits non-zero on failure.
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/read-env-var.sh
source "${_SCRIPT_DIR}/../lib/read-env-var.sh"

ROOT="${DEPLOY_PATH:-$(cd "${_SCRIPT_DIR}/../../.." && pwd)}"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/compose/docker-compose.prod.yml}"
COMPOSE_DEPLOY_FILE="${COMPOSE_DEPLOY_FILE:-infra/docker/compose/docker-compose.deploy.yml}"
ENV_FILE="${ENV_FILE:-infra/env/prod/.env}"

if [[ "$ENV_FILE" = /* ]]; then
  env_abs="$ENV_FILE"
else
  env_abs="${ROOT}/${ENV_FILE}"
fi

if [[ -f "$env_abs" ]]; then
  API_HOST="${API_HOST:-$(read_env_var_from_file "$env_abs" API_HOST)}"
  APP_DOMAIN="${APP_DOMAIN:-$(read_env_var_from_file "$env_abs" APP_DOMAIN)}"
  HEALTH_CHECK_HTTP_HOST="${HEALTH_CHECK_HTTP_HOST:-$(read_env_var_from_file "$env_abs" HEALTH_CHECK_HTTP_HOST)}"
  HEALTH_CHECK_PATH="${HEALTH_CHECK_PATH:-$(read_env_var_from_file "$env_abs" HEALTH_CHECK_PATH)}"
fi

APP_DOMAIN="${APP_DOMAIN:-${API_HOST:-}}"
HEALTH_CHECK_HTTP_HOST="${HEALTH_CHECK_HTTP_HOST:-${API_HOST:-backend}}"
HEALTH_CHECK_PATH="${HEALTH_CHECK_PATH:-/api/health/}"
# Ensure path starts with /
[[ "$HEALTH_CHECK_PATH" == /* ]] || HEALTH_CHECK_PATH="/${HEALTH_CHECK_PATH}"

APP_SERVICES=(backend frontend-main frontend-admin nginx)
HEALTH_CHECK_MAX_WAIT="${HEALTH_CHECK_MAX_WAIT:-120}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-5}"

compose() {
  docker compose \
    --project-directory "$ROOT" \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    -f "$COMPOSE_DEPLOY_FILE" \
    "$@"
}

echo "==> Container status"
compose ps

for svc in "${APP_SERVICES[@]}"; do
  state=$(compose ps --status running --services 2>/dev/null | grep -x "$svc" || true)
  if [[ -z "$state" ]]; then
    echo "::error::Service '${svc}' is not running." >&2
    compose ps
    exit 1
  fi
done

echo "==> Backend health (internal, Host: ${HEALTH_CHECK_HTTP_HOST}, path: ${HEALTH_CHECK_PATH}, up to ${HEALTH_CHECK_MAX_WAIT}s)"
if ! compose exec -T \
  -e "HEALTH_CHECK_MAX_WAIT=${HEALTH_CHECK_MAX_WAIT}" \
  -e "HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL}" \
  -e "HEALTH_CHECK_HTTP_HOST=${HEALTH_CHECK_HTTP_HOST}" \
  -e "HEALTH_CHECK_PATH=${HEALTH_CHECK_PATH}" \
  backend python -c "
import os, sys, time, urllib.error, urllib.request

path = os.environ.get('HEALTH_CHECK_PATH', '/api/health/')
if not path.startswith('/'):
    path = '/' + path
url = 'http://127.0.0.1:8000' + path
host_header = os.environ.get('HEALTH_CHECK_HTTP_HOST', 'backend')
max_wait = int(os.environ.get('HEALTH_CHECK_MAX_WAIT', '120'))
interval = int(os.environ.get('HEALTH_CHECK_INTERVAL', '5'))
per_attempt_timeout = 15
deadline = time.time() + max_wait
last_err = None

while time.time() < deadline:
    try:
        req = urllib.request.Request(url, headers={'Host': host_header})
        with urllib.request.urlopen(req, timeout=per_attempt_timeout) as r:
            if r.status == 200:
                sys.exit(0)
    except Exception as e:
        last_err = e
    time.sleep(interval)

sys.stderr.write('Last error: {!r}\n'.format(last_err))
sys.exit(1)
"; then
  echo "::error::Backend ${HEALTH_CHECK_PATH} check failed after ${HEALTH_CHECK_MAX_WAIT}s." >&2
  echo "::error::Check: docker compose logs backend --tail 80" >&2
  echo "::error::HTTP 400 often means DisallowedHost: set HEALTH_CHECK_HTTP_HOST or API_HOST in .env to a value in ALLOWED_HOSTS." >&2
  echo "::error::Prod settings reject placeholder secrets: POSTGRES_PASSWORD and SECRET_KEY must not start with \"change-me\"." >&2
  exit 1
fi
echo "Backend ${HEALTH_CHECK_PATH} OK"

# Prod Nginx routes the API by hostname (API_HOST), not by IP alone.
if [[ -n "${API_HOST:-}" ]]; then
  if curl -skf --max-time 10 -H "Host: ${API_HOST}" "https://127.0.0.1${HEALTH_CHECK_PATH}" > /dev/null 2>&1; then
    echo "Nginx https://127.0.0.1${HEALTH_CHECK_PATH} (Host: ${API_HOST}) OK"
  else
    echo "Nginx HTTPS health check skipped (TLS/certs, API vhost, or path not reachable on 127.0.0.1)"
  fi
fi

if [[ -n "${APP_DOMAIN:-}" ]]; then
  echo "==> Public health check: https://${APP_DOMAIN}${HEALTH_CHECK_PATH}"
  if ! curl -sf --max-time 15 "https://${APP_DOMAIN}${HEALTH_CHECK_PATH}" > /dev/null; then
    echo "::error::Public health check failed for https://${APP_DOMAIN}${HEALTH_CHECK_PATH}" >&2
    exit 1
  fi
  echo "Public health check OK"
fi

echo "==> All health checks passed"
