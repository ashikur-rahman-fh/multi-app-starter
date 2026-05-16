# Development

## Local prerequisites

- Docker Desktop (or Docker Engine) with Compose v2
- Node 20+ and Python 3.12+ for local editor tooling (Docker remains the runtime source of truth for apps)

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
# or: make check
```

This matches CI **codebase-quality** (format, lint, typecheck, Vitest, Next builds, Ruff). Backend pytest runs in Docker via `make test` (CI **docker-tests** job) — not part of `pnpm check`.

Auto-fix commands (JS/TS: Prettier formats, ESLint fixes logic/imports — `eslint-config-prettier` disables conflicting rules):

```bash
npx pnpm@9.15.0 fix           # Prettier + ESLint (recommended before commit)
npx pnpm@9.15.0 format        # Prettier only
npx pnpm@9.15.0 lint:fix      # Prettier, then ESLint --fix
npx pnpm@9.15.0 python:format # Ruff format
npx pnpm@9.15.0 python:lint:fix
```

With format-on-save enabled, VS Code/Cursor uses Prettier for layout and ESLint for fixes (see `.vscode/settings.json`).

Full CI parity: `pnpm check` then `make test` (backend pytest in Docker). See [`testing.md`](testing.md).

Deploying Docker images via a deployment branch uses the same test suite in CI first — see [`runbook-docker-deploy.md`](runbook-docker-deploy.md).

### Next.js production builds only

To confirm both frontends compile for production without running the full quality gate:

```bash
npx pnpm@9.15.0 build
# or: make build
```

This builds `frontend-main` and `frontend-admin` with `NEXT_PUBLIC_API_BASE_URL` set (same as CI) and verifies each `.next/BUILD_ID` exists.

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

After the first boot (and whenever you change models):

```bash
make backend-migrate
```

Create new migrations from model changes:

```bash
make backend-makemigrations
```

## Django admin superuser

```bash
make backend-createsuperuser
```

## Shared package workflow

The shared library lives in `packages/shared` and is consumed via workspace protocol:

```json
"@starter/shared": "workspace:*"
```

Imports use package exports:

```ts
import { getHello } from '@starter/shared/api/hello';
```

Next.js is configured to transpile the workspace dependency (`transpilePackages`).

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
npx pnpm@9.15.0 install
python3 -m venv apps/backend/.venv
apps/backend/.venv/bin/pip install -r apps/backend/requirements-dev.txt
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
| `.next/types` warnings                                                   | Run `pnpm dev` once in a frontend app, or ignore until first dev session                                                                                                                                                                                                                                     |
| Wrong workspace                                                          | Close folder and re-open the **monorepo root**                                                                                                                                                                                                                                                               |
