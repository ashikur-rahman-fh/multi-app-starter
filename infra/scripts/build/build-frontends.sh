#!/usr/bin/env bash
# Production-build both Next.js apps and verify build artifacts exist.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-https://api.example.test}"

echo "==> Building @starter/frontend-main (NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL})"
pnpm --filter @starter/frontend-main run build

echo "==> Building @starter/frontend-admin"
pnpm --filter @starter/frontend-admin run build

verify_build() {
  local app_dir="$1"
  local label="$2"
  local build_id="${app_dir}/.next/BUILD_ID"

  if [[ ! -f "$build_id" ]]; then
    echo "ERROR: ${label} build failed — missing ${build_id}" >&2
    exit 1
  fi

  echo "OK: ${label} (BUILD_ID=$(tr -d '\n' < "$build_id"))"
}

verify_build "apps/frontend-main" "frontend-main"
verify_build "apps/frontend-admin" "frontend-admin"

echo "Both Next.js production builds succeeded."
