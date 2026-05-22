#!/usr/bin/env bash
# Ensure NEXT_PUBLIC_BACKEND_MAIN_API_URL is safe for browser use in production builds/deploys.
# Usage:
#   validate-backend-main-api-url.sh [URL] [mode]
#   mode: production (default) | dev
set -euo pipefail

_trim() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

URL="$(_trim "${1:-${NEXT_PUBLIC_BACKEND_MAIN_API_URL:-}}")"
MODE="${2:-production}"

if [[ -z "$URL" ]]; then
  echo "::error::NEXT_PUBLIC_BACKEND_MAIN_API_URL is not set." >&2
  echo "::error::Set it to the browser-facing API origin (e.g. https://api.example.com), not an internal Docker hostname." >&2
  exit 1
fi

if [[ "$URL" == */ ]]; then
  echo "::error::NEXT_PUBLIC_BACKEND_MAIN_API_URL must not end with a slash (got: ${URL})" >&2
  exit 1
fi

case "$MODE" in
  production)
    if [[ ! "$URL" =~ ^https:// ]]; then
      echo "::error::Production NEXT_PUBLIC_BACKEND_MAIN_API_URL must use https:// (got: ${URL})" >&2
      exit 1
    fi
    if [[ "$URL" =~ (^|//)(localhost|127\.0\.0\.1|backend|nginx)([:/]|$) ]]; then
      echo "::error::Production NEXT_PUBLIC_BACKEND_MAIN_API_URL must not use internal/dev hosts (got: ${URL})" >&2
      exit 1
    fi
    if [[ "$URL" =~ :(8000|8080|3000|3001)(/|$) ]]; then
      echo "::error::Production NEXT_PUBLIC_BACKEND_MAIN_API_URL must not use dev ports (got: ${URL})" >&2
      exit 1
    fi
    ;;
  dev)
    if [[ ! "$URL" =~ ^https?:// ]]; then
      echo "::error::Dev NEXT_PUBLIC_BACKEND_MAIN_API_URL must use http:// or https:// (got: ${URL})" >&2
      exit 1
    fi
    if [[ "$URL" =~ (^|//)(backend|nginx)([:/]|$) ]]; then
      echo "::error::Dev NEXT_PUBLIC_BACKEND_MAIN_API_URL must be reachable from the browser, not a Docker service name (got: ${URL})" >&2
      echo "::error::Use http://localhost:8080 when browsing via dev Nginx, or http://localhost:8000 for direct backend access." >&2
      exit 1
    fi
    ;;
  *)
    echo "::error::Unknown mode: ${MODE} (use production or dev)" >&2
    exit 1
    ;;
esac

echo "OK: NEXT_PUBLIC_BACKEND_MAIN_API_URL=${URL} (${MODE})"
