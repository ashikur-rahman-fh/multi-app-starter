# Developer runbook

## First-time setup

1. Install Docker + Compose v2.
2. Copy env files:

```bash
cp infra/env/dev/.env.example infra/env/dev/.env
cp infra/env/test/.env.example infra/env/test/.env
```

3. Install JS deps for Docker (required on macOS; safe on all platforms):

```bash
make dev-install-js
```

For VS Code/Cursor and local `pnpm check`, also run `make editor-happy` (host deps). On macOS, run `make dev-install-js` again before Docker dev after `editor-happy`.

4. Start dev stack:

```bash
make dev-up
```

5. The backend container applies migrations on startup. If you change models later, run `make backend-makemigrations` and restart (`make dev-restart`).

## Daily workflow

- Start: `make dev-up` (detached; no log stream in that shell)
- Logs (all services): `make dev-logs` (or `docker compose ... logs -f <service>` for one service)
- Stop: `make dev-down`
- Tests before pushing: `make test`
- Deploying via branch (build/push Docker images): see [runbook-docker-deploy.md](runbook-docker-deploy.md)

## Add a backend endpoint

1. Add a view in `apps/backend/api/views.py` (or a new app module).
2. Wire URL in `apps/backend/api/urls.py`.
3. Add tests under `apps/backend/tests/`.
4. Run `make test-backend` (or `make test`).

Keep public API surface intentional; this starter ships `/api/health/`, `/api/hello/`, and `/api/public/meta/` as examples. Release metadata lives in `apps/backend/api/app_metadata.py` (see [development.md](development.md#release-metadata)).

## Add a frontend page

1. Add a route under `apps/frontend-main/src/app/` (App Router).
2. Prefer importing shared helpers/components from `@starter/shared/*`.
3. Add/adjust Vitest tests colocated or in `*.test.tsx`.

## Add a shared API helper

1. Add a module under `packages/shared/src/api/`.
2. Export it from `packages/shared/package.json` `exports`.
3. Add unit tests in `packages/shared/src`.
4. Consume from apps via `import ... from "@starter/shared/..."`.

## Add a shared component

1. Add under `packages/shared/src/components/`.
2. Export via `package.json` `exports`.
3. Add RTL tests.

## Add tests

- Backend: pytest modules under `apps/backend/tests/`.
- Frontend: Vitest + RTL (`*.test.tsx`).
- Shared: Vitest in `packages/shared`.
- Integration: prefer `@pytest.mark.integration` for DB/Redis connectivity checks.

## Run regular development

```bash
make dev-up
```

## Run debug development

```bash
make debug-up
```

## Debug Django with VS Code

1. Copy dev env (once):

```bash
cp infra/env/dev/.env.example infra/env/dev/.env
```

2. Start debug stack:

```bash
make debug-up
```

3. Open VS Code at the repo root.
4. Run and Debug → select **Attach to Django Backend Docker**.
5. Set a breakpoint in Django code (for example `apps/backend/api/views.py`).
6. Trigger a request:

`http://localhost:8000/api/hello/`

7. VS Code should stop at the breakpoint.

### Notes

- [`infra/docker/compose/docker-compose.dev.yml`](../infra/docker/compose/docker-compose.dev.yml) is for regular development.
- [`infra/docker/compose/docker-compose.debug.yml`](../infra/docker/compose/docker-compose.debug.yml) is for attach debugging.
- [`infra/docker/compose/docker-compose.prod.yml`](../infra/docker/compose/docker-compose.prod.yml) must never expose debugpy.
- Debug port is **5678**; Django listens on **8000** in this skeleton.
- If you need Django to pause until the debugger attaches, set `WAIT_FOR_DEBUGGER=true` in `infra/env/dev/.env` and restart the debug stack.

## Run tests before pushing

```bash
make test
```
