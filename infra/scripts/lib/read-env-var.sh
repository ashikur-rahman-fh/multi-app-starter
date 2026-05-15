#!/usr/bin/env bash
# Safe .env reader (never source the file). Usage: read_env_var_from_file /path/to/.env KEY
read_env_var_from_file() {
  local file="$1"
  local key="$2"
  if [[ ! -f "$file" ]]; then
    return 0
  fi
  grep -E "^${key}=" "$file" | head -1 | cut -d= -f2- | tr -d '\r' || true
}
