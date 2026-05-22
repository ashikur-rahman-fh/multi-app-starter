#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

if [[ ! -f infra/env/prod/.env ]]; then
  echo "Missing infra/env/prod/.env — copy infra/env/prod/.env.example first." >&2
  exit 1
fi

bash infra/scripts/nginx/render-prod-config.sh

echo "==> Backend release tasks (migrate, collectstatic) before starting app services"
bash infra/scripts/deploy/backend-release-tasks.sh

docker compose \
  --project-directory "$ROOT" \
  --env-file infra/env/prod/.env \
  -f infra/docker/compose/docker-compose.prod.yml \
  up --build -d
