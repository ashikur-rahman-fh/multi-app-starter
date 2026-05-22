# Development

## Local prerequisites

- Docker Desktop (or Docker Engine) with Compose v2
- Node 20+ and Python 3.12+ for local editor tooling (Docker remains the runtime source of truth for apps)
- On Debian/Ubuntu, the host `python3` used for editor setup needs the matching **`python3.X-venv`** package (e.g. `python3.12-venv` or `python3.14-venv` for whatever `python3 --version` reports). Without it, `python3 -m venv` can create `apps/backend/.venv` with no `pip`

### Editor setup (one command)

After cloning, run from the **repository root**:

```bash
make editor-happy
```

Then open the repo root in VS Code/Cursor and run **Developer: Reload Window**. This installs `node_modules`, creates `apps/backend/.venv`, and installs Python dev dependencies. Safe to re-run anytime.

See [Fixing editor import/package errors](#fixing-editor-importpackage-errors) if squiggles remain.

## Code quality (before PR)

Run the read-only quality gate from the repo root:

```bash
npx pnpm@9.15.0 check
# or: make check-code-quality
```

This matches CI **codebase-quality** (format, lint, typecheck, Vitest, Next builds, Ruff). Backend pytest and admin routing smoke run in Docker via `make test` (CI **docker-tests** job) — not part of `pnpm check`.

Auto-fix commands (JS/TS: Prettier formats, ESLint fixes logic/imports — `eslint-config-prettier` disables conflicting rules):

```bash
make fix-code-quality       # Prettier write + ESLint --fix (JS/TS) + Ruff format/lint --fix (Python)
# or:
npx pnpm@9.15.0 fix           # Prettier + ESLint only (no Python)
npx pnpm@9.15.0 format        # Prettier only
npx pnpm@9.15.0 lint:fix      # Prettier, then ESLint --fix
npx pnpm@9.15.0 python:format # Ruff format
npx pnpm@9.15.0 python:lint:fix
```

With format-on-save enabled, VS Code/Cursor uses Prettier for layout and ESLint for fixes (see `.vscode/settings.json`).

Full CI parity: `pnpm check` then `make test` (backend pytest + admin smoke in Docker). See [`testing.md`](testing.md).

Deploying Docker images via a deployment branch uses the same test suite in CI first — see [`runbook-docker-deploy.md`](runbook-docker-deploy.md).

### Next.js production builds only

To confirm both frontends compile for production without running the full quality gate:

```bash
npx pnpm@9.15.0 build
# or: make build
```

This builds `frontend-main` and `frontend-admin` with `NEXT_PUBLIC_BACKEND_MAIN_API_URL` set (same as CI) and verifies each `.next/BUILD_ID` exists.

## Environment files

Copy examples:

```bash
cp infra/env/dev/.env.example infra/env/dev/.env
cp infra/env/test/.env.example infra/env/test/.env
```

Details: [`environment-variables.md`](environment-variables.md)

## Docker Compose location

- Compose files: **`infra/docker/compose/docker-compose.{dev,debug,test,prod}.yml`**
- Dockerfiles: **`infra/docker/<service>/`**
- Prefer **`make …`** targets; they run `docker compose --project-directory <repo-root> -f infra/docker/compose/...` so YAML paths resolve correctly.

Manual example (from repo root):

```bash
docker compose --project-directory "$(pwd)" -f infra/docker/compose/docker-compose.dev.yml up --build
```

## Start services

`make dev-up` and `make debug-up` start Compose **detached** (containers run in the background; that shell does not stream logs). Use **`make dev-logs`** / **`make debug-logs`** to follow backend logs, or run `docker compose ... logs -f` for other services.

Regular development:

```bash
make dev-up
```

Debug development (Django under debugpy):

```bash
make debug-up
```

## Database migrations

The **development backend container** applies committed migrations automatically on startup (`wait_for_db` → migration file check → `migrate --noinput`). You do not need to run `make backend-migrate` after every normal schema change once migration files exist.

After you change Django models, create migration files (not auto-generated at startup):

```bash
make backend-makemigrations
```

Restart the backend container (or `make dev-restart`) so the new migrations are applied.

Manual migrate (troubleshooting or one-off):

```bash
make backend-migrate
```

Verify migration files are committed before opening a PR:

```bash
make backend-check-migrations
```

CI runs the same checks (`manage.py check` and `makemigrations --check --dry-run`).

## Django admin superuser

```bash
make backend-createsuperuser
```

## Release metadata

Public release information is served by **`GET /api/public/meta/`**. Values come from source-controlled code in [`apps/backend/api/app_metadata.py`](../apps/backend/api/app_metadata.py), not deployment environment variables. That keeps version updates intentional, reviewable, and tied to the code being deployed.

**Update before each release:**

1. Edit `APP_METADATA` in `app_metadata.py` (`version`, `releaseDate`, optional `releaseLabel`).
2. Run format and tests (see [Code quality (before PR)](#code-quality-before-pr)).
3. Verify the endpoint, for example: `curl -s http://localhost:8080/api/public/meta/`

**Example response:**

```json
{
  "appName": "Starter App",
  "version": "1.0.0",
  "releaseDate": "2026-05-16",
  "releaseLabel": "Latest Release"
}
```

Only expose public-safe fields in this endpoint (no commit SHA, build timestamps, hostnames, environment names, secrets, or infrastructure details).

### Release checklist

Before creating a release branch or deployment:

- [ ] Update `version` and `releaseDate` in `apps/backend/api/app_metadata.py`
- [ ] Update `releaseLabel` if needed
- [ ] Run `npx pnpm@9.15.0 python:format` and `make test` (or `make test-backend`)
- [ ] Confirm `GET /api/public/meta/` returns the expected JSON

## Shared package workflow

The shared library lives in `packages/shared` and is consumed via workspace protocol:

```json
"@starter/shared": "workspace:*"
```

Next.js is configured to transpile the workspace dependency (`transpilePackages`).

### Shared UI

Import components from `@starter/shared/ui` and styles once per app layout. See [`ui-system.md`](ui-system.md) for theming, shadcn CLI usage, and component rules.

```tsx
import { Button, Alert, Navbar } from '@starter/shared/ui';
import '@starter/shared/ui/styles/globals.css';
```

Run UI tests: `npx pnpm@9.15.0 --filter @starter/shared test`

### Backend API client

All browser-to-backend HTTP goes through `@starter/shared`. **Do not** install or import Axios in `apps/frontend-main` or `apps/frontend-admin`.

**Typical usage (endpoint helper):**

```ts
import { getHello } from '@starter/shared/api/hello';
import { useApi } from '@starter/shared/hooks/useApi';

const { state, reload } = useApi(() => getHello());
```

**Direct client usage:**

```ts
import { backendMainApi, isApiError } from '@starter/shared/api';

type HealthResponse = { status: string };

try {
  const health = await backendMainApi.get<HealthResponse>('/api/health/');
} catch (error) {
  if (isApiError(error)) {
    // error.message is safe for UI; error.isUnauthorized for future redirect
  }
}
```

**Adding another backend later:**

1. Add `NEXT_PUBLIC_BACKEND_SECONDARY_API_URL` to env templates and `packages/shared/src/api/core/env.ts`.
2. Create `packages/shared/src/api/clients/backend-secondary.ts` with `createApiClient(...)`.
3. Export from `packages/shared/src/api/index.ts`.
4. Use `backendSecondaryApi.get(...)` in app code.

**Developer rules:**

- Do not duplicate API clients inside frontend apps.
- Do not hardcode API URLs; use `NEXT_PUBLIC_BACKEND_MAIN_API_URL`.
- Do not expose raw backend or Axios errors to users.
- Do not log secrets, tokens, cookies, `Authorization`, CSRF headers, or sensitive request bodies.

**CSRF (when cookie auth is enabled):**

```ts
createApiClient({
  serviceName: 'backend-main',
  baseURL: env.backendMainApiUrl,
  withCredentials: true,
  csrf: {
    enabled: true,
    cookieName: 'csrftoken',
    headerName: 'X-CSRFToken',
  },
});
```

Production Django sets `CSRF_COOKIE_HTTPONLY=True`, so JavaScript cannot read `csrftoken` today; use a server/BFF route for CSRF when adding session auth.

## Common commands

See the root [`README.md`](../README.md) Makefile table.

## Regular dev vs debug dev

- **Regular dev** ([`infra/docker/compose/docker-compose.dev.yml`](../infra/docker/compose/docker-compose.dev.yml)): fastest iteration; Django `runserver` without debugpy.
- **Debug dev** ([`infra/docker/compose/docker-compose.debug.yml`](../infra/docker/compose/docker-compose.debug.yml)): same topology, exposes **5678** and runs Django under debugpy for IDE attach debugging.

## VS Code attach debugging

See [`runbook-development.md`](runbook-development.md#debug-django-with-vs-code) for the step-by-step attach flow.

## Fixing editor import/package errors

### Quick fix

```bash
make editor-happy
```

Then **Developer: Reload Window** in VS Code/Cursor.

### Why errors appear

`node_modules` and `apps/backend/.venv` are gitignored. Language servers need local installs even when Docker runs the apps. Open the **repo root**, not `apps/frontend-main` or `apps/backend` alone.

### Confirm imports resolve

- **TypeScript:** open a frontend file — `@starter/shared/...` and `react` should have no red squiggles
- **Python:** open `apps/backend/api/views.py` — `rest_framework` should resolve
- **Interpreter:** status bar should show `apps/backend/.venv/bin/python`

Optional checks from repo root:

```bash
npx pnpm@9.15.0 typecheck
source apps/backend/.venv/bin/activate && ruff check apps/backend
```

### Manual setup (if `make editor-happy` fails)

```bash
# Debian/Ubuntu: X = minor version from `python3 --version` (e.g. 3.14 -> python3.14-venv)
sudo apt install python3.X-venv
rm -rf apps/backend/.venv   # required if a prior run left a venv without pip

npx pnpm@9.15.0 install
python3 -m venv apps/backend/.venv
apps/backend/.venv/bin/python -m pip install -r apps/backend/requirements-dev.txt
```

Select interpreter: **Python: Select Interpreter** → `apps/backend/.venv`.

### Still complaining?

| Symptom                                                                  | Try                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| JS/TS modules missing                                                    | Re-run `make editor-happy`; **TypeScript: Restart TS Server**; **TypeScript: Select TypeScript Version** → Use Workspace Version                                                                                                                                                                             |
| Python modules missing (`django`, `rest_framework`)                      | Re-run `make editor-happy`; **Python: Select Interpreter** → `apps/backend/.venv`; reload window. If using **BasedPyright** (Cursor default), repo settings point it at `apps/backend` — ensure you opened the **monorepo root**, not `apps/backend` alone                                                   |
| Works in VS Code but not **Cursor**                                      | Cursor uses built-in **Cursor Pyright** (`cursorpyright`), not Pylance. Run `make editor-happy` (creates a root `.venv` symlink), reload window, and select `apps/backend/.venv`. Disable the **BasedPyright** extension in Cursor if installed (it conflicts). Optional: **Cursor Pyright: Restart Server** |
| BasedPyright / Pyright `reportMissingImports`                            | Reload window. Root [`pyrightconfig.json`](../pyrightconfig.json) points at `apps/backend/.venv`                                                                                                                                                                                                             |
| `make editor-happy` fails with pnpm `ENOENT` on `node_modules/.pnpm/...` | Corrupted install — run `rm -rf node_modules && make editor-happy` (the script retries automatically on failure)                                                                                                                                                                                             |
| `make editor-happy`: `apps/backend/.venv/bin/pip: No such file or directory` (or script says pip is not available) | Install `python3.X-venv` for your `python3` version, `rm -rf apps/backend/.venv`, re-run `make editor-happy`. See [runbook-troubleshooting.md](runbook-troubleshooting.md#editor-setup-fails-missing-pip)                                                                                                                                                                  |
| `.next/types` warnings                                                   | Run `pnpm dev` once in a frontend app, or ignore until first dev session                                                                                                                                                                                                                                     |
| Wrong workspace                                                          | Close folder and re-open the **monorepo root**                                                                                                                                                                                                                                                               |
