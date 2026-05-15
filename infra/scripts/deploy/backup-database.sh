#!/usr/bin/env bash
# Create a timestamped database backup before deployment (default: PostgreSQL via Compose).
# If the DB service is not running, skips backup and exits 0 so first-time deploy can proceed.
# Exits non-zero only when a backup was attempted and failed.
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/read-env-var.sh
source "${_SCRIPT_DIR}/../lib/read-env-var.sh"

ROOT="${DEPLOY_PATH:-$(cd "${_SCRIPT_DIR}/../../.." && pwd)}"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/compose/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-infra/env/prod/.env}"
DB_SERVICE="${DB_SERVICE_NAME:-postgres}"
BRANCH_SLUG="${BRANCH_SLUG:?BRANCH_SLUG is required}"

if [[ "$ENV_FILE" = /* ]]; then
  env_abs="$ENV_FILE"
else
  env_abs="${ROOT}/${ENV_FILE}"
fi
if [[ ! -f "$env_abs" ]]; then
  echo "::error::Missing env file on the deployment server (SSH target), not on your laptop: ${env_abs}" >&2
  echo "::error::Create it on the VM: ssh to the server, cd \"${ROOT}\", then cp infra/env/prod/.env.example infra/env/prod/.env and edit secrets (never commit .env)." >&2
  exit 1
fi

# Read DB credentials from the same file Compose uses (never source .env).
POSTGRES_USER="${POSTGRES_USER:-$(read_env_var_from_file "$env_abs" POSTGRES_USER)}"
POSTGRES_DB="${POSTGRES_DB:-$(read_env_var_from_file "$env_abs" POSTGRES_DB)}"
if [[ -z "$POSTGRES_USER" ]]; then
  echo "::error::POSTGRES_USER is not set in ${env_abs}" >&2
  exit 1
fi
if [[ -z "$POSTGRES_DB" ]]; then
  echo "::error::POSTGRES_DB is not set in ${env_abs}" >&2
  exit 1
fi

if [[ -z "${BACKUP_DIR:-}" ]]; then
  PROJECT_NAME="$(read_env_var_from_file "$env_abs" PROJECT_NAME)"
  PROJECT_NAME="${PROJECT_NAME:-multi-app-starter}"
  BACKUP_DIR="/var/backups/${PROJECT_NAME}"
fi
BACKUP_DIR="${BACKUP_DIR%/}"

compose() {
  docker compose \
    --project-directory "$ROOT" \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    "$@"
}

if [[ -n "${DB_BACKUP_COMMAND:-}" ]]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="${BACKUP_DIR}/${BRANCH_SLUG}_db_backup_${TIMESTAMP}.sql"
  umask 077
  mkdir -p "$BACKUP_DIR"
  chmod 700 "$BACKUP_DIR"
  echo "==> Database backup (custom): ${BACKUP_FILE}"
  export BACKUP_FILE ROOT COMPOSE_FILE ENV_FILE DB_SERVICE BACKUP_DIR
  bash -c "$DB_BACKUP_COMMAND"
  if [[ ! -s "$BACKUP_FILE" ]]; then
    echo "::error::Backup file is empty or missing: ${BACKUP_FILE}" >&2
    exit 1
  fi
  chmod 600 "$BACKUP_FILE"
  echo "==> Backup complete: ${BACKUP_FILE} ($(wc -c < "$BACKUP_FILE" | tr -d ' ') bytes)"
  exit 0
fi

# Default: pg_dump only when the DB container is already running.
if ! compose ps --status running --services 2>/dev/null | grep -qx "$DB_SERVICE"; then
  echo "==> Skipping database backup: service '${DB_SERVICE}' is not running (nothing to dump)."
  echo "==> First deploy or stack stopped — deploy will continue. Next run will backup once Postgres is up."
  exit 0
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${BRANCH_SLUG}_db_backup_${TIMESTAMP}.sql"

umask 077
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "==> Database backup: ${BACKUP_FILE} (database: ${POSTGRES_DB})"

db_exists=$(compose exec -T "$DB_SERVICE" \
  psql -U "$POSTGRES_USER" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB}'" 2>/dev/null | tr -d '[:space:]' || true)

if [[ "$db_exists" != "1" ]]; then
  echo "::error::Database \"${POSTGRES_DB}\" does not exist in Postgres (from ${env_abs})." >&2
  echo "::error::Postgres only creates POSTGRES_DB on first volume init. Changing .env later does not create it." >&2
  echo "::error::Databases on this server:" >&2
  compose exec -T "$DB_SERVICE" psql -U "$POSTGRES_USER" -d postgres -tAc \
    "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY 1" 2>/dev/null \
    | sed 's/^/  - /' >&2 || true
  echo "::error::Fix: set POSTGRES_DB in .env to an existing database, or create it:" >&2
  echo "::error::  compose exec -T postgres psql -U ${POSTGRES_USER} -d postgres -c \"CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};\"" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

if ! compose exec -T "$DB_SERVICE" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"; then
  echo "::error::pg_dump failed for database \"${POSTGRES_DB}\"." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

if [[ ! -s "$BACKUP_FILE" ]]; then
  echo "::error::Backup file is empty or missing: ${BACKUP_FILE}" >&2
  exit 1
fi

chmod 600 "$BACKUP_FILE"

echo "==> Backup complete: ${BACKUP_FILE} ($(wc -c < "$BACKUP_FILE" | tr -d ' ') bytes)"
