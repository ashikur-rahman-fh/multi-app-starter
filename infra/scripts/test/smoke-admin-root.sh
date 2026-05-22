#!/bin/sh
# Curl checks: admin Next app serves home page at / on port 3001.
set -eu

BASE_URL="${SMOKE_ADMIN_URL:-http://frontend-admin:3001}"
MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-60}"
SLEEP_SECS="${SMOKE_SLEEP_SECS:-2}"
# Override with SMOKE_ADMIN_MARKER for a single substring check (default: compound markers below).
SMOKE_ADMIN_MARKER="${SMOKE_ADMIN_MARKER:-}"

echo "==> Waiting for admin app at ${BASE_URL}/"

last_http_ok=0
attempt=0
while [ "$attempt" -lt "$MAX_ATTEMPTS" ]; do
  attempt=$((attempt + 1))
  if body=$(curl -sf "${BASE_URL}/" 2>/dev/null); then
    last_http_ok=1
    if [ -n "$SMOKE_ADMIN_MARKER" ]; then
      if echo "$body" | grep -q "$SMOKE_ADMIN_MARKER"; then
        echo "OK: GET / returns admin home page (marker: ${SMOKE_ADMIN_MARKER})"
        exit 0
      fi
      echo "  attempt ${attempt}/${MAX_ATTEMPTS}: HTTP 200 but missing marker \"${SMOKE_ADMIN_MARKER}\""
    elif echo "$body" | grep -q 'admin-home-page' \
      && echo "$body" | grep -q 'Admin App' \
      && echo "$body" | grep -q 'Admin shell'; then
      echo "OK: GET / returns admin home page"
      exit 0
    else
      echo "  attempt ${attempt}/${MAX_ATTEMPTS}: HTTP 200 but admin home markers not found yet"
    fi
  else
    last_http_ok=0
    echo "  attempt ${attempt}/${MAX_ATTEMPTS}: HTTP not ready"
  fi
  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    if [ "$last_http_ok" -eq 1 ]; then
      echo "FAIL: admin root returned HTTP 200 but expected page content was missing" >&2
      echo "  Expected: data-testid=admin-home-page, \"Admin App\", and \"Admin shell\" (or SMOKE_ADMIN_MARKER)" >&2
    else
      echo "FAIL: admin root did not become reachable in time" >&2
    fi
    exit 1
  fi
  sleep "$SLEEP_SECS"
done
