#!/usr/bin/env bash
# Deploy registry images to this VM (GitHub Actions SSH or: make prod-deploy IMAGE_TAG=...).
# Required: IMAGE_TAG. Other settings from environment and/or infra/env/prod/.env (see load-deploy-env.sh).
set -euo pipefail

# shellcheck source=load-deploy-env.sh
source "$(dirname "${BASH_SOURCE[0]}")/load-deploy-env.sh"

IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required (e.g. make prod-deploy IMAGE_TAG=staging-260516-1)}"
GIT_REF="${GIT_REF:-${GITHUB_REF_NAME:-}}"

cd "$DEPLOY_PATH"

export BACKEND_IMAGE="${DOCKER_REPO}-backend:${IMAGE_TAG}"
export FRONTEND_MAIN_IMAGE="${DOCKER_REPO}-frontend-main:${IMAGE_TAG}"
export FRONTEND_ADMIN_IMAGE="${DOCKER_REPO}-frontend-admin:${IMAGE_TAG}"
export NGINX_IMAGE="${DOCKER_REPO}-nginx:${IMAGE_TAG}"

export DEPLOY_PATH COMPOSE_FILE COMPOSE_DEPLOY_FILE ENV_FILE BRANCH_SLUG COMPOSE_PROJECT_NAME
export HEALTH_CHECK_HTTP_HOST HEALTH_CHECK_PATH APP_DOMAIN API_HOST
export BACKUP_DIR="${BACKUP_DIR:-}"
export DB_SERVICE_NAME="${DB_SERVICE_NAME:-}"
export DB_BACKUP_COMMAND="${DB_BACKUP_COMMAND:-}"
export APP_DOMAIN="${APP_DOMAIN:-}"

compose() {
  docker compose \
    --project-directory "$DEPLOY_PATH" \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    -f "$COMPOSE_DEPLOY_FILE" \
    "$@"
}

echo "==> Deploying ${IMAGE_TAG} to ${DEPLOY_PATH}"
echo "    Images: ${BACKEND_IMAGE}, ${FRONTEND_MAIN_IMAGE}, ..."

if [[ "$ENV_FILE" = /* ]]; then
  env_abs="$ENV_FILE"
else
  env_abs="${DEPLOY_PATH}/${ENV_FILE}"
fi
if [[ ! -f "$env_abs" ]]; then
  echo "::error::Missing ${ENV_FILE} on this server at ${env_abs}" >&2
  echo "::error::Copy from example on the VM: cp infra/env/prod/.env.example infra/env/prod/.env" >&2
  exit 1
fi

# 1. Database backup (before any container changes)
bash infra/scripts/deploy/backup-database.sh

# 2. Save previous deployment tag for rollback
cp .current_deployment .previous_deployment 2>/dev/null || true

# 3. Sync repo (compose/scripts); server .env and certs are not touched
if [[ "${SKIP_GIT_SYNC:-}" != "1" && -d .git ]]; then
  echo "==> Syncing repository"
  git fetch origin --prune
  if [[ -n "${GIT_REF:-}" ]]; then
    git checkout "$GIT_REF"
    git pull --ff-only origin "$GIT_REF"
  fi
elif [[ "${SKIP_GIT_SYNC:-}" == "1" ]]; then
  echo "==> Skipping git sync (SKIP_GIT_SYNC=1)"
fi

# 4. Render Nginx vhosts from infra/env/prod/.env (MAIN_FRONTEND_HOST, etc.)
bash infra/scripts/nginx/render-prod-config.sh

# 5. Registry login
echo "==> Docker registry login"
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

# 6. Pull exact deployment tags (never deploy -latest alone)
echo "==> Pulling images for tag ${IMAGE_TAG}"
compose pull backend frontend-main frontend-admin nginx

# 7. Migrations and collectstatic (one-off jobs before serving traffic)
bash infra/scripts/deploy/backend-release-tasks.sh

# 8. Restart without building
echo "==> Starting containers (no local build)"
compose up -d --no-build --remove-orphans

# 9. Prune unused images
docker image prune -f

compose ps

# 10. Health checks
bash infra/scripts/deploy/health-check.sh

# 11. Record successful deployment
echo "$IMAGE_TAG" > .current_deployment
echo "==> Deployment complete: ${IMAGE_TAG}"
