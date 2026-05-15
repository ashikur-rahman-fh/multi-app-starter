# Docker Compose and images

## Layout (from `infra/docker/compose/`)

| Location                                   | Contents                                                          |
| ------------------------------------------ | ----------------------------------------------------------------- |
| **This directory**                         | `docker-compose.{dev,debug,test,prod,deploy}.yml` — stack definitions |
| [`../backend/`](../backend/)               | Django `Dockerfile.dev`, `Dockerfile.prod`                        |
| [`../frontend-main/`](../frontend-main/)   | Main Next.js `Dockerfile.dev`, `Dockerfile.prod`                  |
| [`../frontend-admin/`](../frontend-admin/) | Admin Next.js `Dockerfile.dev`, `Dockerfile.prod`                 |
| [`../nginx/`](../nginx/)                   | Nginx `Dockerfile`                                                |
| [`../test-runner/`](../test-runner/)       | CI/local test image (`Dockerfile`) used by the test compose stack |

Compose files use paths relative to the **repository root** (`./apps/...`, `./infra/...`). Always run Compose with **`--project-directory` set to the repo root** (the root [`Makefile`](../../../Makefile) and [`infra/scripts/`](../../scripts/) wrappers do this). Example:

```bash
docker compose --project-directory "$(pwd)" -f infra/docker/compose/docker-compose.dev.yml up --build
```

Prefer **`make dev-up`**, **`make test`**, etc., instead of typing Compose flags by hand.

## Registry deploy overlay (`docker-compose.deploy.yml`)

Used on the VM when deploying pre-built images from a registry (GitHub Actions deploy job). Merge with prod compose:

```bash
export BACKEND_IMAGE=myorg/my-app-backend:staging-260515-1
export FRONTEND_MAIN_IMAGE=myorg/my-app-frontend-main:staging-260515-1
export FRONTEND_ADMIN_IMAGE=myorg/my-app-frontend-admin:staging-260515-1
export NGINX_IMAGE=myorg/my-app-nginx:staging-260515-1

docker compose --project-directory "$(pwd)" \
  --env-file infra/env/prod/.env \
  -f infra/docker/compose/docker-compose.prod.yml \
  -f infra/docker/compose/docker-compose.deploy.yml \
  pull

docker compose ... up -d --no-build
```

Local **`make prod-up`** still uses prod compose only with `--build` — unchanged.

See [`docs/runbook-docker-deploy.md`](../../../docs/runbook-docker-deploy.md) for the full deploy flow.

See [`../README.md`](../README.md) for the full Docker overview (Compose + Dockerfiles).
