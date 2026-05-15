# Testing

## What runs where

| Suite               | Runner                              | Location                                      |
| ------------------- | ----------------------------------- | --------------------------------------------- |
| Backend unit        | pytest                              | `apps/backend/tests` (excludes `integration`) |
| Backend integration | pytest (`@pytest.mark.integration`) | `apps/backend/tests/integration`              |
| Frontend main       | Vitest                              | `apps/frontend-main/HomePage.test.tsx`        |
| Frontend admin      | Vitest                              | `apps/frontend-admin/AdminHomePage.test.tsx`  |
| Shared package      | Vitest                              | `packages/shared/src/**/*.test.*`             |

Frontend tests use **MSW** to mock `/api/hello/` in a way that works both locally and in Docker (handlers use `*/api/hello/`).

## Running tests locally (host)

Requires a working pnpm install:

```bash
npx pnpm@9.15.0 -r test
```

Backend pytest on the host requires PostgreSQL/Redis matching `config.settings.test` (by default the Docker-backed URLs in `infra/env/test/.env`). For consistency, prefer Docker tests.

## Running tests via Makefile / Docker (canonical)

Ensure `infra/env/test/.env` exists:

```bash
cp infra/env/test/.env.example infra/env/test/.env
make test
```

[`infra/scripts/test/test-all.sh`](../infra/scripts/test/test-all.sh) brings up **postgres-test** and **redis-test** in the background, waits until they accept connections, then runs **`docker compose run --rm --build --no-deps test-runner`** so only the runner’s logs stream to your terminal. It always runs `docker compose down` afterward (including on failure).

## Test compose design

[`infra/docker/compose/docker-compose.test.yml`](../infra/docker/compose/docker-compose.test.yml):

- **postgres-test** + **redis-test** use healthchecks; `test-all.sh` additionally probes readiness before the runner starts.
- **test-runner** (Python + Node image) is started with `compose run` once dependencies are up.
- The runner script executes, in order:
  - `pytest -m "not integration"`
  - Vitest for `frontend-main`
  - Vitest for `frontend-admin`
  - Vitest for `shared`
  - `pytest -m integration`

## GitHub Actions

### Pull requests and `master` — [`.github/workflows/basic-ci.yml`](../.github/workflows/basic-ci.yml)

Two jobs run on every push to `master` and on all pull requests:

| Job                  | What it runs                                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **codebase-quality** | `pnpm format:check`, Ruff format/lint, `pnpm typecheck`, `pnpm lint`, `pnpm test`, production build for **frontend-main** and **frontend-admin** (`.next/BUILD_ID` verified), dependency audit                          |
| **docker-tests**     | Copies `infra/env/test/.env.example` → `infra/env/test/.env`, then `bash infra/scripts/test/test-all.sh` (same as `make test`)                                                                                             |

The Docker **test-runner** also runs static quality gates (format, lint, typecheck) before pytest and Vitest.

### Deployment branches — [`.github/workflows/docker-deploy-branches.yml`](../.github/workflows/docker-deploy-branches.yml)

Runs when you push `staging_*` or `release_*` deployment branches. Jobs: validate → test → frontend production builds → build/push images → **deploy to VM** (DB backup, pull exact tag, `compose up --no-build`, health checks). See **[runbook-docker-deploy.md](runbook-docker-deploy.md)**.

### Pre-PR command (host)

For fast feedback without Docker:

```bash
npx pnpm@9.15.0 check
```

This does **not** run backend pytest. Use `make test` for the full suite including Postgres/Redis integration tests.
