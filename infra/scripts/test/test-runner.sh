#!/usr/bin/env bash
set -euo pipefail
cd /workspace

export CI=true

if [ -f pnpm-lock.yaml ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi

echo "==> Quality gates (format, lint, typecheck)"
cd /workspace
pnpm format:check
pnpm python:format:check
pnpm python:lint
pnpm typecheck
pnpm lint

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.test}"

echo "==> Backend unit tests (pytest, excluding integration)"
cd /workspace/apps/backend
pytest -m "not integration" -v --tb=short

echo "==> Frontend main (Vitest)"
cd /workspace
pnpm --filter @starter/frontend-main exec vitest run

echo "==> Frontend admin (Vitest)"
pnpm --filter @starter/frontend-admin exec vitest run

echo "==> Shared package (Vitest)"
pnpm --filter @starter/shared exec vitest run

echo "==> Backend integration tests (pytest)"
cd /workspace/apps/backend
pytest -m integration -v --tb=short

echo "All test stages passed."
