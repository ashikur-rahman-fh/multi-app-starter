# Testing

## What runs where

| Suite               | Where (CI / local)                    | Command / job                                      |
| ------------------- | ------------------------------------- | -------------------------------------------------- |
| Format, lint, types | Host                                  | `pnpm check` / CI **codebase-quality**             |
| Vitest (all apps)   | Host                                  | `pnpm test` / CI **codebase-quality**              |
| Next prod builds    | Host                                  | `pnpm build` / CI **codebase-quality**             |
| Backend unit        | Docker (Postgres + Redis)             | `make test` / CI **docker-tests**                  |
| Backend integration | Docker (Postgres + Redis)             | `make test` / CI **docker-tests**                  |
| Admin root routing  | Docker (curl smoke)                   | `make test` / CI **docker-tests**                  |

Frontend tests use **MSW** to mock `/api/hello/` (handlers use `*/api/hello/`). Axios uses XHR in jsdom; MSW 2.x intercepts those requests.

### Shared API client unit tests

`@starter/shared` API tests live under `packages/shared/src/api/core/`:

- **Adapter mocks** — `createApiClient({ adapter })` with `createMockAdapter()` for deterministic unit tests (no real network).
- **Coverage** — success/error paths, CSRF, env validation, safe logging redaction.
- **Integration** — `hello.integration.test.ts` uses MSW against `getHello()`.

Run shared tests only:

```bash
npx pnpm@9.15.0 --filter @starter/shared test
```

### Shared UI component tests

Vitest + Testing Library tests for the design system live under `packages/shared/src/ui/`:

- `components/button/button.test.tsx`
- `components/alert/alert.test.tsx`
- `components/navbar/navbar.test.tsx`
- `theme/theme-provider.test.tsx`

Frontend home page tests assert integration with `@starter/shared/ui` imports. See [`ui-system.md`](ui-system.md).

## Full CI parity locally

```bash
cp infra/env/test/.env.example infra/env/test/.env
pnpm check          # format, lint, typecheck, Vitest, Next builds, Ruff
make test           # backend pytest + admin root smoke in Docker
```

## Running tests via Makefile / Docker

[`infra/scripts/test/test-all.sh`](../infra/scripts/test/test-all.sh):

1. Starts **postgres-test** and **redis-test**, waits for readiness
2. Runs **`test-runner`** (pytest unit + integration)
3. Runs **admin root routing smoke** ([`test-smoke-admin.sh`](../infra/scripts/test/test-smoke-admin.sh)) — curls `http://frontend-admin:3001/` inside Compose and asserts the admin home page HTML contains `admin-home-page`, `Admin App`, and `Admin shell` (see [`smoke-admin-root.sh`](../infra/scripts/test/smoke-admin-root.sh)). If you change admin home copy or layout, update that script.

```bash
make test
make test-smoke-admin   # smoke only, without pytest
```

Per-package Docker runners still exist for ad-hoc use (`make test-backend`, `make test-integration`, etc.).

## Test compose design

[`infra/docker/compose/docker-compose.test.yml`](../infra/docker/compose/docker-compose.test.yml):

- **postgres-test** + **redis-test** — healthchecks; `test-all.sh` probes readiness before the runner
- **test-runner** — runs [`test-runner.sh`](../infra/scripts/test/test-runner.sh): pytest unit, then integration

Admin routing smoke uses [`docker-compose.smoke.yml`](../infra/docker/compose/docker-compose.smoke.yml) (separate stack: `frontend-admin` + one-shot `curl`).

## GitHub Actions

### Pull requests and `master` — [`.github/workflows/basic-ci.yml`](../.github/workflows/basic-ci.yml)

| Job                  | What it runs                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **codebase-quality** | Prettier, Ruff, Django `manage.py check`, `makemigrations --check --dry-run`, ESLint, typecheck, Vitest, Next production builds, dependency audit                       |
| **docker-tests**     | After quality passes: `test-all.sh` — backend pytest + admin root routing smoke                                                                                       |

### Deployment branches — [`.github/workflows/docker-deploy-branches.yml`](../.github/workflows/docker-deploy-branches.yml)

Runs on `staging_*` / `release_*`: validate → `test-all.sh` (pytest + admin smoke) → frontend production builds (real `NEXT_PUBLIC_BACKEND_MAIN_API_URL`) → build/push → deploy. See [runbook-docker-deploy.md](runbook-docker-deploy.md).

## Pre-PR quick check (host only)

```bash
npx pnpm@9.15.0 check
```

Does **not** run backend pytest or admin smoke. Add `make test` before merging if you changed routing, Django models, migrations, or integration tests.
