#!/usr/bin/env bash

log_info() {
  echo "INFO: $*"
}

log_success() {
  echo "SUCCESS: $*"
}

log_warning() {
  echo "WARNING: $*"
}

log_error() {
  echo "ERROR: $*" >&2
}

require_docker() {
  if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not reachable. Start Docker Desktop and retry."
    exit 1
  fi
}

require_env_file() {
  local env_file="$1"
  local hint="$2"
  if [[ ! -f "$env_file" ]]; then
    log_error "Missing ${env_file} — ${hint}"
    exit 1
  fi
}

require_compose_service() {
  local compose_file="$1"
  local service="$2"
  local make_target="${3:-dev-up}"
  local env_file="${4:-}"

  local -a compose_args=(docker compose --project-directory "$ROOT" -f "$compose_file")
  if [[ -n "$env_file" ]]; then
    compose_args+=(--env-file "$env_file")
  fi

  if [[ -z "$("${compose_args[@]}" ps -q "$service" 2>/dev/null)" ]]; then
    log_error "Service ${service} is not running. Start the stack with: make ${make_target}"
    exit 1
  fi
}
