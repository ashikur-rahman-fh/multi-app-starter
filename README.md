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
| Web (public)   | Next.js 16 (`apps/frontend-main`, `apps/frontend-admin`) |
| Shared UI/API  | pnpm workspace package `@starter/shared` (API client, design system, hooks) |
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

### Setup after clone

From the **repository root**:

**Docker dev** (recommended on macOS — installs Linux-native `node_modules` for bind mounts):

```bash
make dev-install-js
make dev-up
```

**Editor / local `pnpm check`** (host `node_modules` + Python venv for VS Code/Cursor):

```bash
make editor-happy
```

Then open the repo in VS Code/Cursor and run **Developer: Reload Window**. Safe to re-run either command.

Dev Compose mounts the repo into containers ([`docker-compose.dev.yml`](infra/docker/compose/docker-compose.dev.yml)), so `node_modules` must match the **container OS** (Linux), not only the host. On macOS, run `make dev-install-js` before `make dev-up`. If you run `make editor-happy` for the IDE, run `make dev-install-js` again before Docker dev. See [`docs/development.md`](docs/development.md#docker-js-dependencies-macos--bind-mounts).

If `make editor-happy` fails (e.g. missing `pip` in the venv), see [`docs/runbook-troubleshooting.md`](docs/runbook-troubleshooting.md#editor-setup-fails-missing-pip). If imports still show errors after a successful run, see [`docs/development.md`](docs/development.md#fixing-editor-importpackage-errors).

## Code quality checks

Before pushing a branch or opening a PR, run the full static quality gate (does **not** modify files):

```bash
npx pnpm@9.15.0 check
# or: make check-code-quality
```

To auto-fix formatting and lint (modifies files — Prettier, ESLint, Ruff):

```bash
make fix-code-quality
```

`make check-code-quality` runs, in order:

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

`make dev-up` starts the stack **in the background** (no log stream in that terminal). Use **`make dev-logs`** when you want to follow all service logs (or run `docker compose ... logs -f <service>` for one service).

```bash
make dev-up
```

Migrations apply automatically when the backend container starts. After model changes, create migration files with `make backend-makemigrations`, then restart the backend (`make dev-restart`). Use `make backend-migrate` only for manual troubleshooting.

Create a superuser (Django HTML admin and Next admin app):

```bash
make backend-createsuperuser
```

### URLs (development)

| Surface        | URL                                                                                  |
| -------------- | ------------------------------------------------------------------------------------ |
| **Nginx (recommended)** | http://localhost:8080 — main site, `/api/`, `/admin/` (Django)                       |
| Main frontend  | http://localhost:3000 (direct) or http://localhost:8080/ (via Nginx)                 |
| Admin frontend | http://localhost:3001/login (Next admin sign-in; profile at `/`)                   |
| Backend API (browser) | http://localhost:8080/api/ via Nginx (`NEXT_PUBLIC_BACKEND_MAIN_API_URL`)             |
| Backend API (direct) | http://localhost:8000/api/ (host → container; debugging only)                  |
| Django admin   | http://localhost:8080/admin/ (Nginx) or http://localhost:8000/admin/               |

**Note:** Django’s HTML admin is at `/admin/` on Nginx (`:8080`). The Next admin app runs on **`:3001`** with session auth against `/api/admin/auth/*`. Dev Compose sets `NEXT_PUBLIC_BACKEND_MAIN_API_URL=http://localhost:8080` for browser API calls via Nginx. See [`docs/development.md`](docs/development.md#next-admin-app-authentication).

## Debug development (Django + debugpy)

Use this stack when you want VS Code (or another DAP client) to attach to Django. **`make debug-up`** also runs **detached**; use **`make debug-logs`** for all service logs.

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
| Editor     | `make editor-happy` (host `node_modules` + Python venv for VS Code/Cursor)                                                                 |
| Quality    | `make fix-code-quality` (Prettier + ESLint + Ruff auto-fix), `make check-code-quality` (read-only gate, same as `pnpm check`), `make build` (Next.js prod builds) |
| Dev        | `make dev-up`, `make dev-down`, `make dev-build`, `make dev-logs`, `make dev-restart`, `make dev-install-js` (Linux `node_modules` for Docker on macOS) |
| Debug      | `make debug-up`, `make debug-down`, `make debug-build`, `make debug-logs`, `make debug-restart`, `make debug-install-js`                   |
| Backend    | `make backend-migrate`, `make backend-makemigrations`, `make backend-check-migrations`, `make backend-createsuperuser`, `make backend-sync-superusers`, `make backend-reset-user-password`, `make backend-shell` |
| Admin ops  | `make prod-sync-superusers`, `make prod-reset-user-password`, `make test-sync-superusers`, `make test-reset-user-password` |
| Tests      | `make test`, `make test-smoke-admin`, `make test-backend`, `make test-frontend-main`, `make test-frontend-admin`, `make test-shared`, `make test-integration` |
| Prod       | `make prod-up` (local build; runs migrate + collectstatic), `make prod-deploy IMAGE_TAG=…` (registry pull; same release tasks), `make prod-rollback`, `make prod-down`, `make prod-build`, `make prod-logs`, `make prod-restart`, `make prod-migrate`, `make prod-collectstatic`, `make prod-nginx-config` |
| DB helpers | `make db-backup`, `make db-restore`, `make db-reset` (`FORCE=1` skips reset confirmation)                                                  |

## Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/ui-system.md`](docs/ui-system.md)
- [`docs/development.md`](docs/development.md) — includes [release metadata](docs/development.md#release-metadata) (`GET /api/public/meta/`)
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
import { Button } from '@starter/shared/ui';
```

This is powered by `package.json` `exports` in `packages/shared` and `transpilePackages` in each Next config.
