#!/usr/bin/env bash
# Backend tests in Docker (Postgres + Redis). Static checks and Vitest run on the host
# in CI (codebase-quality) and via `pnpm check` locally — not duplicated here.
set -euo pipefail
cd /workspace

export CI=true
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.test}"

echo "==> Backend unit tests (pytest, excluding integration)"
cd /workspace/apps/backend
pytest -m "not integration" -v --tb=short

echo "==> Backend integration tests (pytest)"
pytest -m integration -v --tb=short

echo "Backend Docker test stages passed."
