# Troubleshooting runbook

## Editor shows missing imports / modules

Symptoms: VS Code/Cursor reports `Cannot find module`, `Import could not be resolved`, or missing `django` / `rest_framework` after clone.

Fix:

1. From repo root: `make editor-happy`
2. Open the **monorepo root** (not a subfolder)
3. **Developer: Reload Window**
4. See [`development.md`](development.md#fixing-editor-importpackage-errors) for interpreter, TypeScript server, and other follow-ups

## Port already in use

Symptoms: Compose fails binding `3000`, `3001`, `8000`, `8080`, `5432`, `6379`, or `5678`.

Fix:

- Stop other stacks: `make dev-down` / `make debug-down`
- Find the process using the port (platform-specific) and stop it
- As a last resort, change host port mappings in the Compose file (not recommended long-term; update docs if you do)

## Docker build fails

Common causes:

- Stale build cache: `docker compose ... build --no-cache`
- Missing `pnpm-lock.yaml` after dependency edits: run `pnpm install` at repo root and commit the lockfile
- Corporate proxy TLS interception: configure Docker daemon trust (environment-specific)

## Database connection fails

Checklist:

- Postgres is healthy: `docker compose ... ps`
- `POSTGRES_*` variables match between Django and Postgres service
- You ran migrations: `make backend-migrate`
- You are not accidentally pointing Django at the wrong compose stack

## Redis connection fails

Checklist:

- Redis is healthy
- `REDIS_URL` matches the compose service hostname (`redis` in dev, `redis-test` in test)

## Frontend cannot reach backend

Checklist:

- `NEXT_PUBLIC_API_BASE_URL` points to a URL reachable **from the browser** (not `http://backend:8000` unless you truly intend that)
- In Docker dev, prefer `http://localhost:8000` for browser-based access

## CORS issues

Symptoms: browser blocks API calls with CORS errors.

Fix:

- Ensure `CORS_ALLOWED_ORIGINS` includes the exact browser origin (scheme + host + port)
- Include Nginx origin if you browse via `http://localhost:8080`

## Migration issues

Symptoms: `django.db.migrations.exceptions...` or “relation does not exist”.

Fix:

- `make backend-migrate`
- If you changed models: `make backend-makemigrations` then migrate again

## Missing env file

Symptoms: Compose warns about missing `env_file`.

Fix:

```bash
cp infra/env/dev/.env.example infra/env/dev/.env
cp infra/env/test/.env.example infra/env/test/.env
```

## VS Code debugger cannot attach

Checklist:

- You started **debug** stack (`make debug-up`), not only dev
- Port `5678` is published and not blocked by firewall/VPN
- You selected the correct launch configuration
- If your Python extension expects the newer adapter, try changing `.vscode/launch.json` `type` from `python` to `debugpy` (extension-version dependent)

## Breakpoint not hit / wrong file mapping

Checklist:

- `pathMappings` in `.vscode/launch.json` must match the container layout (`/app` maps to `apps/backend`)
- You attached **after** the interpreter is listening (unless you used `WAIT_FOR_DEBUGGER=true`)

## debugpy port not reachable

Checklist:

- Confirm mapping exists only in [`infra/docker/compose/docker-compose.debug.yml`](../infra/docker/compose/docker-compose.debug.yml)
- Confirm backend container logs show debugpy listening on `0.0.0.0:5678`

## Production certificate missing

Symptoms: Nginx fails TLS handshake or refuses to start.

Fix:

- Add `origin.crt` and `origin.key` under `infra/nginx/prod/certs/` on the deployment host
- Keep keys out of git (see `infra/nginx/prod/certs/README.md`)
