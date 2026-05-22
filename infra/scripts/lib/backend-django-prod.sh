#!/usr/bin/env bash
# Shared production Django release helpers (migrate, collectstatic).
# Expects compose() to be defined by the caller.

backend_compose_run() {
  compose run --rm -T --no-deps backend "$@"
}

backend_wait_for_postgres_healthy() {
  local max_wait="${BACKEND_DB_HEALTH_MAX_WAIT:-120}"
  local interval="${BACKEND_DB_HEALTH_INTERVAL:-2}"
  local elapsed=0

  echo "==> Waiting for postgres to be healthy (up to ${max_wait}s)"
  while [[ "$elapsed" -lt "$max_wait" ]]; do
    if compose exec -T postgres sh -c 'pg_isready -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"' 2>/dev/null; then
      echo "==> Postgres is ready"
      return 0
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  echo "::error::Postgres did not become ready within ${max_wait}s." >&2
  compose ps postgres 2>/dev/null || true
  compose logs postgres --tail 20 2>/dev/null || true
  return 1
}

backend_release_migrate() {
  echo "==> Backend: waiting for database (Django)"
  backend_compose_run python manage.py wait_for_db

  echo "==> Backend: migration plan"
  backend_compose_run python manage.py showmigrations --plan

  echo "==> Backend: checking for pending migrations"
  if backend_compose_run python manage.py migrate --check; then
    echo "==> Backend: no pending migrations"
  else
    echo "==> Backend: pending migrations detected; applying"
  fi

  echo "==> Backend: applying migrations"
  backend_compose_run python manage.py migrate --noinput
  echo "==> Backend: migrations completed"
}

backend_release_collectstatic() {
  echo "==> Backend: collecting static files"
  backend_compose_run python manage.py collectstatic --noinput
  echo "==> Backend: static files collected"
}

backend_release_tasks() {
  echo "==> Backend release tasks: ensuring postgres and redis are up"
  compose up -d postgres redis
  backend_wait_for_postgres_healthy
  backend_release_migrate
  backend_release_collectstatic
}
