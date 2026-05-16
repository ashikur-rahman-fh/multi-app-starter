# Testing

## What runs where

| Suite               | Where (CI / local)                    | Command / job                                      |
| ------------------- | ------------------------------------- | -------------------------------------------------- |
| Format, lint, types | Host                                  | `pnpm check` / CI **codebase-quality**             |
| Vitest (all apps)   | Host                                  | `pnpm test` / CI **codebase-quality**              |
| Next prod builds    | Host                                  | `pnpm build` / CI **codebase-quality**             |
| Backend unit        | Docker (Postgres + Redis)             | `make test` / CI **docker-tests**                  |
| Backend integration | Docker (Postgres + Redis)             | `make test` / CI **docker-tests**                  |

Frontend tests use **MSW** to mock `/api/hello/` (handlers use `*/api/hello/`).

## Full CI parity locally

```bash
cp infra/env/test/.env.example infra/env/test/.env
pnpm check          # format, lint, typecheck, Vitest, Next builds, Ruff
make test           # backend pytest (unit + integration) in Docker
```

## Running tests via Makefile / Docker (backend only)

[`infra/scripts/test/test-all.sh`](../infra/scripts/test/test-all.sh) starts **postgres-test** and **redis-test**, waits for readiness, runs **`test-runner`** (pytest only), then tears the stack down.

```bash
make test
```

Per-package Docker runners still exist for ad-hoc use (`make test-backend`, `make test-integration`, etc.).

## Test compose design

[`infra/docker/compose/docker-compose.test.yml`](../infra/docker/compose/docker-compose.test.yml):

- **postgres-test** + **redis-test** — healthchecks; `test-all.sh` probes readiness before the runner
- **test-runner** — runs [`test-runner.sh`](../infra/scripts/test/test-runner.sh): pytest unit, then integration (no duplicate format/lint/Vitest)

## GitHub Actions

### Pull requests and `master` — [`.github/workflows/basic-ci.yml`](../.github/workflows/basic-ci.yml)

| Job                  | What it runs                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **codebase-quality** | Prettier, Ruff, ESLint, typecheck, Vitest, Next production builds, dependency audit                                                                                   |
| **docker-tests**     | After quality passes: `test-all.sh` — backend pytest only (Postgres/Redis in Compose)                                                                                  |

### Deployment branches — [`.github/workflows/docker-deploy-branches.yml`](../.github/workflows/docker-deploy-branches.yml)

Runs on `staging_*` / `release_*`: validate → backend Docker tests → frontend production builds (real `NEXT_PUBLIC_API_BASE_URL`) → build/push → deploy. See [runbook-docker-deploy.md](runbook-docker-deploy.md).

## Pre-PR quick check (host only)

```bash
npx pnpm@9.15.0 check
```

Does **not** run backend pytest. Add `make test` before merging if you changed Django models, migrations, or integration tests.
