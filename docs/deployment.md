# Deployment (skeleton)

This repository includes a **minimal** production Compose stack intended as a starting point, not a complete production hardening guide.

## Automated Docker image deploys

To build and push production images from GitHub when you push a deployment branch (`staging_YYMMDD_N` or `release_YYMMDD_N`), follow the step-by-step guide:

**[runbook-docker-deploy.md](runbook-docker-deploy.md)**

That runbook covers branch naming, GitHub Environment setup (`staging_env` / `release_env`), image tags, and what happens when tests fail.

Workflow file: [`.github/workflows/docker-deploy-branches.yml`](../.github/workflows/docker-deploy-branches.yml)

After images are pushed, the workflow **SSHs to the VM**, backs up PostgreSQL, pulls the immutable image tag (e.g. `staging-260515-1`), runs **one-off backend release tasks** (pending migration check, `migrate --noinput`, `collectstatic --noinput`), then `docker compose up -d --no-build`. See the runbook for VM bootstrap, secrets, backup location, and rollback.

Registry deploy uses [`infra/docker/compose/docker-compose.deploy.yml`](../infra/docker/compose/docker-compose.deploy.yml) merged with prod compose on the server.

### Manual registry deploy on the VM

Add `DOCKER_REPO`, `BRANCH_SLUG`, `DOCKER_USERNAME`, and `DOCKER_TOKEN` to `infra/env/prod/.env` on the server (see `.env.example`). Then:

| Command | Use when |
| ------- | -------- |
| `make prod-deploy IMAGE_TAG=staging-260516-1` | Pull a specific tag from the registry |
| `make prod-rollback` | Revert to `.previous_deployment` |
| `make prod-up` | Build and run from source on the server (no registry tag) |

See [runbook-docker-deploy.md](runbook-docker-deploy.md) → Manual deploy and rollback.

## Compose (local / server)

Production stack: [`infra/docker/compose/docker-compose.prod.yml`](../infra/docker/compose/docker-compose.prod.yml)

```bash
cp infra/env/prod/.env.example infra/env/prod/.env
make prod-up
```

## TLS certificates

Nginx expects files mounted at:

- `./infra/nginx/prod/certs` → `/etc/nginx/certs` (read-only)

Expected filenames (see `infra/nginx/prod/certs/README.md`):

- `origin.crt`
- `origin.key`

Do not commit real private keys.

## Nginx routing (sample)

The sample config routes by hostname:

- `starter.com` / `www.starter.com` → `frontend-main`
- `admin.starter.com` → `frontend-admin`
- `api.starter.com` → Django (includes `/admin/` for Django admin)

Set hostnames in `infra/env/prod/.env` (`MAIN_FRONTEND_HOST`, `MAIN_FRONTEND_WWW_HOST`, `ADMIN_FRONTEND_HOST`, `API_HOST`), then run `make prod-nginx-config` to render `infra/nginx/prod/conf.d/default.conf` (generated file, gitignored). The deploy workflow runs this automatically on the VM.

Set `COMPOSE_PROJECT_NAME` in `.env` before the first production deploy and **do not change it** afterward (Docker volume names depend on it). Existing servers using `starter-prod-*` containers should set `COMPOSE_PROJECT_NAME=starter-prod`.

## Build-time frontend configuration

Next.js bakes `NEXT_PUBLIC_*` variables at build time. [`infra/docker/compose/docker-compose.prod.yml`](../infra/docker/compose/docker-compose.prod.yml) passes:

- `NEXT_PUBLIC_BACKEND_MAIN_API_URL`
- `NEXT_PUBLIC_BASE_PATH` (usually empty when using host-based routing)

## Backend process model

Production backend runs **Gunicorn** (`infra/docker/backend/Dockerfile.prod`). Migrations and static collection are **not** run from Gunicorn workers.

### Migrations and static files (automated on deploy)

[`infra/scripts/deploy/backend-release-tasks.sh`](../infra/scripts/deploy/backend-release-tasks.sh) runs before the app stack restarts:

1. Ensure `postgres` and `redis` are up
2. `wait_for_db` → `showmigrations --plan` → `migrate --check` (log only) → `migrate --noinput`
3. `collectstatic --noinput` into the `backend_staticfiles` Docker volume

This is invoked from [`vm-deploy.sh`](../infra/scripts/deploy/vm-deploy.sh) and [`make prod-up`](../Makefile) (local prod build). Production **never** runs `makemigrations`; CI catches missing migration files.

If deploy fails during release tasks, the script exits non-zero and `.current_deployment` is not updated.

Manual overrides (stack already running):

```bash
make prod-migrate
make prod-collectstatic
```

Static files are served by **WhiteNoise** from `/app/staticfiles` (named volume in prod compose). Nginx proxies API traffic to Django; no separate nginx static root for Django admin assets.

## Basic startup command

```bash
docker compose --project-directory "$(pwd)" -f infra/docker/compose/docker-compose.prod.yml up --build -d
```

## Safety notes

- [`infra/docker/compose/docker-compose.prod.yml`](../infra/docker/compose/docker-compose.prod.yml) does **not** expose debugpy.
- Keep production secrets out of git; use your platform’s secret manager in real deployments.
