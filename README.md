# Multi-app starter (Hello World skeleton)

A small, modular monorepo intended as a base for multi-application products:

- **Backend**: Django + Django REST Framework + PostgreSQL + Redis
- **Frontends**: two Next.js (TypeScript) apps sharing a workspace package
- **Infra**: Docker Compose stacks for dev, debug, test, and prod, plus Nginx routing scripts

This repository intentionally avoids authentication, authorization, payments, and advanced observability. Extend it as your product grows.

## Tech stack

| Layer          | Choice                                                   |
| -------------- | -------------------------------------------------------- |
| API            | Django + DRF (`apps/backend`)                            |
| DB             | PostgreSQL                                               |
| Cache          | Redis (`django-redis`)                                   |
| Web (public)   | Next.js 14 (`apps/frontend-main`, `apps/frontend-admin`) |
| Shared UI/API  | pnpm workspace package `@starter/shared`                 |
| Reverse proxy  | Nginx (`infra/nginx`)                                    |
| JS tooling     | pnpm workspaces, ESLint, Prettier, TypeScript            |
| Python tooling | Ruff (lint + format)                                     |
| Tests          | pytest + Vitest + Testing Library (+ MSW where useful)   |

## Repository layout

```text
apps/backend              Django project
apps/frontend-main        Main Next.js app (:3000)
apps/frontend-admin       Admin Next.js shell (:3001)
packages/shared           Shared TS/React library (`@starter/shared`)
infra/docker/compose/       Docker Compose stacks (dev, debug, test, prod)
infra/docker/{backend,...} Dockerfiles per service
infra/env/{dev,test,prod}   Environment templates (.env.example)
docs/                     Architecture + runbooks
```

## Prerequisites

- Docker + Docker Compose v2
- Node 20+ and Python 3.12+ for local editor tooling (Docker is the source of truth for running apps)

### Editor setup (recommended after clone)

From the **repository root**:

```bash
make editor-happy
```

Then open the repo in VS Code/Cursor and run **Developer: Reload Window**. This installs JS workspace dependencies and the Python virtualenv at `apps/backend/.venv`. Safe to re-run.

`make editor-happy` is also required for [`docker-compose.dev.yml`](infra/docker/compose/docker-compose.dev.yml) / [`docker-compose.debug.yml`](infra/docker/compose/docker-compose.debug.yml) Node bind mounts (local `node_modules`).

If imports still show errors, see [`docs/development.md`](docs/development.md#fixing-editor-importpackage-errors).

## Code quality checks

Before pushing a branch or opening a PR, run the full static quality gate (does **not** modify files):

```bash
npx pnpm@9.15.0 check
# or: make check
```

This runs, in order:

1. Prettier format check
2. ESLint (Next apps + `@starter/shared`)
3. TypeScript typecheck (`tsc --noEmit`)
4. Vitest (all workspace packages)
5. Next.js production builds (both frontends)
6. Ruff format check + lint for `apps/backend`

To auto-fix formatting and lint issues:

```bash
npx pnpm@9.15.0 format
npx pnpm@9.15.0 lint:fix
npx pnpm@9.15.0 python:format
npx pnpm@9.15.0 python:lint:fix
```

**Backend pytest** (unit + integration with Postgres/Redis) is **not** part of `pnpm check`. Run the canonical Docker test suite instead:

```bash
make test
```

To verify **only** that both Next.js apps production-build successfully (faster than full `check`):

```bash
npx pnpm@9.15.0 build
# or: make build
```

CI runs separate build steps for each app plus artifact verification (see [`docs/testing.md`](docs/testing.md)).

CI runs static checks and Vitest in `codebase-quality`, then backend pytest and admin root routing smoke in Docker (`docker-tests`). See [`docs/testing.md`](docs/testing.md).

## First-time environment setup

Do **not** commit real `.env` files. Copy examples:

```bash
cp infra/env/dev/.env.example infra/env/dev/.env
cp infra/env/test/.env.example infra/env/test/.env
# Production (only when you need it)
cp infra/env/prod/.env.example infra/env/prod/.env
```

See [`docs/environment-variables.md`](docs/environment-variables.md) for what each variable does.

## Regular development (hot reload)

`make dev-up` starts the stack **in the background** (no log stream in that terminal). Use **`make dev-logs`** when you want to follow backend logs (or run `docker compose ... logs -f` for other services).

```bash
make dev-up
```

Then run migrations once (and after model changes):

```bash
make backend-migrate
```

Create an admin user for Django admin:

```bash
make backend-createsuperuser
```

### URLs (development)

| Surface        | URL                                                                                  |
| -------------- | ------------------------------------------------------------------------------------ |
| **Nginx (recommended)** | http://localhost:8080 — main site, `/api/`, `/admin/` (Django)                       |
| Main frontend  | http://localhost:3000 (direct) or http://localhost:8080/ (via Nginx)                 |
| Admin frontend | http://localhost:3001/ (admin home page; dedicated port in dev)                      |
| Backend API (browser) | http://localhost:8080/api/ via Nginx (`NEXT_PUBLIC_API_BASE_URL`)             |
| Backend API (direct) | http://localhost:8000/api/ (host → container; debugging only)                  |
| Django admin   | http://localhost:8080/admin/ (Nginx) or http://localhost:8000/admin/               |

**Note:** Django’s admin UI is at `/admin/` on Nginx (`:8080`). The Next admin shell runs on **`:3001/`** so it does not collide with Django. Dev Compose sets `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` for browser API calls via Nginx.

## Debug development (Django + debugpy)

Use this stack when you want VS Code (or another DAP client) to attach to Django. **`make debug-up`** also runs **detached**; use **`make debug-logs`** for backend logs.

```bash
make debug-up
```

- Django: http://localhost:8000
- debugpy listener: **localhost:5678**
- Optional: set `WAIT_FOR_DEBUGGER=true` in `infra/env/dev/.env` to block startup until a debugger attaches.

### Attach VS Code

1. Start debug stack: `make debug-up`
2. Open this repo in VS Code.
3. Run and Debug → choose **Attach to Django Backend Docker**.
4. Set a breakpoint in `apps/backend` (for example in `api/views.py` `hello`).
5. Visit http://localhost:8000/api/hello/
6. Execution should stop on your breakpoint.

[`infra/docker/compose/docker-compose.dev.yml`](infra/docker/compose/docker-compose.dev.yml) is for everyday development. [`infra/docker/compose/docker-compose.debug.yml`](infra/docker/compose/docker-compose.debug.yml) is the same topology, but runs Django under **debugpy** and exposes **5678**. Production must never expose debugpy.

## Tests

Local (requires Docker + `infra/env/test/.env`):

```bash
make test
```

Prefer **`pnpm check`** for format/lint/Vitest/Next builds, then **`make test`** for backend pytest and admin routing smoke in Docker. `make test` runs `test-all.sh` (pytest, then curl smoke for `http://localhost:3001/`). Use **`make test-smoke-admin`** to rerun smoke only.

## Production skeleton

Production Compose is intentionally minimal: Gunicorn for Django, built Next.js standalone outputs, Nginx TLS termination, Postgres, Redis.

```bash
make prod-up
```

You must supply real TLS material under `infra/nginx/prod/certs/` (see that folder’s README).

### Deploy Docker images via GitHub

Push a deployment branch (`staging_YYMMDD_N` or `release_YYMMDD_N`) to build and push images after tests pass. Step-by-step instructions: [`docs/runbook-docker-deploy.md`](docs/runbook-docker-deploy.md).

## Useful Makefile targets

| Area       | Commands                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Editor     | `make editor-happy` (install `node_modules` + Python venv for VS Code/Cursor)                                                              |
| Quality    | `make check` (same as `pnpm check`), `make build` (Next.js prod builds for both frontends)                                                 |
| Dev        | `make dev-up`, `make dev-down`, `make dev-build`, `make dev-logs`, `make dev-restart`                                                      |
| Debug      | `make debug-up`, `make debug-down`, `make debug-build`, `make debug-logs`, `make debug-restart`                                            |
| Backend    | `make backend-migrate`, `make backend-makemigrations`, `make backend-createsuperuser`, `make backend-shell`                                |
| Tests      | `make test`, `make test-smoke-admin`, `make test-backend`, `make test-frontend-main`, `make test-frontend-admin`, `make test-shared`, `make test-integration` |
| Prod       | `make prod-up` (local build), `make prod-deploy IMAGE_TAG=…` (registry pull), `make prod-rollback`, `make prod-down`, `make prod-build`, `make prod-logs`, `make prod-restart`, `make prod-migrate`, `make prod-collectstatic`, `make prod-nginx-config` |
| DB helpers | `make db-backup`, `make db-restore`, `make db-reset` (`FORCE=1` skips reset confirmation)                                                  |

## Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/development.md`](docs/development.md)
- [`docs/testing.md`](docs/testing.md)
- [`docs/deployment.md`](docs/deployment.md)
- [`docs/runbook-development.md`](docs/runbook-development.md)
- [`docs/runbook-docker-deploy.md`](docs/runbook-docker-deploy.md)
- [`docs/runbook-troubleshooting.md`](docs/runbook-troubleshooting.md)
- [`docs/environment-variables.md`](docs/environment-variables.md)

## Shared package imports

Both Next apps import shared code like:

```ts
import { getHello } from '@starter/shared/api/hello';
import { Button } from '@starter/shared/components/Button';
```

This is powered by `package.json` `exports` in `packages/shared` and `transpilePackages` in each Next config.
