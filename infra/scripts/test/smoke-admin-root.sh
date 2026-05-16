#!/bin/sh
# Curl checks: admin Next app serves home page at / on port 3001.
set -eu

BASE_URL="${SMOKE_ADMIN_URL:-http://frontend-admin:3001}"
MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-60}"
SLEEP_SECS="${SMOKE_SLEEP_SECS:-2}"

echo "==> Waiting for admin app at ${BASE_URL}/"

attempt=0
while [ "$attempt" -lt "$MAX_ATTEMPTS" ]; do
  attempt=$((attempt + 1))
  if body=$(curl -sf "${BASE_URL}/" 2>/dev/null); then
    if echo "$body" | grep -q 'Admin App Hello World'; then
      echo "OK: GET / returns admin home page"
      break
    fi
    echo "  attempt ${attempt}/${MAX_ATTEMPTS}: got HTTP 200 but page content not ready yet"
  else
    echo "  attempt ${attempt}/${MAX_ATTEMPTS}: not ready"
  fi
  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    echo "FAIL: admin root did not return expected page in time" >&2
    exit 1
  fi
  sleep "$SLEEP_SECS"
done
