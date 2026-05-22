# Troubleshooting runbook

## Editor shows missing imports / modules

Symptoms: VS Code/Cursor reports `Cannot find module`, `Import could not be resolved`, or missing `django` / `rest_framework` after clone.

Fix:

1. From repo root: `make editor-happy`
2. Open the **monorepo root** (not a subfolder)
3. **Developer: Reload Window**
4. See [`development.md`](development.md#fixing-editor-importpackage-errors) for interpreter, TypeScript server, and other follow-ups

## Editor setup fails (missing pip)

Symptoms: `make editor-happy` exits with `apps/backend/.venv/bin/pip: No such file or directory`, or the script reports that pip is not available after creating the venv.

Cause: Host Python lacks `ensurepip` (common on Debian/Ubuntu when `python3.X-venv` is not installed). `python3 -m venv` may still create `apps/backend/.venv` with `bin/python` but no `pip`.

Fix (from repo root):

```bash
python3 --version   # note minor version X (e.g. 3.14)
sudo apt install python3.X-venv
rm -rf apps/backend/.venv
make editor-happy
```

See [`development.md`](development.md#fixing-editor-importpackage-errors) for manual setup and other editor issues.

## Frontend build error: lightningcss.linux-arm64-gnu.node (Docker on Mac)

Symptoms:

- `make dev-logs` shows `Error: Cannot find module '../lightningcss.linux-arm64-gnu.node'` from `frontend-main` (or `frontend-admin` when CSS compiles)
- Browser `http://localhost:8080/` returns **500** with a PostCSS / `globals.css` build error
- Secondary HMR / “module factory is not available” messages in the browser (usually clear after the server fix + hard refresh)

Cause: Dev Compose bind-mounts the repo. `make editor-happy` (or host `pnpm install`) installs **macOS** native optional deps; Linux containers need **linux-arm64-gnu** (or x64) binaries for Tailwind v4 / `lightningcss`.

Fix (from repo root):

```bash
make dev-install-js
make dev-up
# or: make dev-restart
```

Debug stack: `make debug-install-js` then `make debug-up` / `make debug-restart`.

**Production:** normal prod builds do not mount host `node_modules`; this mismatch does not occur in CI or [`Dockerfile.prod`](../infra/docker/frontend-main/Dockerfile.prod) deploys.

If it persists:

- `make dev-build` (rebuild images), then `make dev-install-js` again
- Confirm container arch: `docker compose --project-directory "$(pwd)" -f infra/docker/compose/docker-compose.dev.yml exec frontend-main uname -m` → `aarch64` on Apple Silicon
- Avoid running host `pnpm dev` alongside Docker (recreates macOS `.next` / deps)
- Hard-refresh the browser (`Cmd+Shift+R`) after the server is healthy

See [`development.md`](development.md#docker-js-dependencies-macos--bind-mounts).

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
- Backend container started successfully (migrations run on startup), or you ran `make backend-migrate`
- You are not accidentally pointing Django at the wrong compose stack

## Redis connection fails

Checklist:

- Redis is healthy
- `REDIS_URL` matches the compose service hostname (`redis` in dev, `redis-test` in test)

## 502 Bad Gateway on `/api/` (dev Nginx)

Symptoms: browser or `curl http://localhost:8080/api/hello/` returns **502**; frontend may show network errors.

Fix:

1. Check logs: `bash infra/scripts/dev/logs.sh` or `make dev-logs` (all services)
2. **ImportError on startup** (e.g. `cannot import name 'throttle_scope'`): fix the Python error in `apps/backend` — Django never listens on `:8000`, so Nginx has no upstream
3. **Database / axes errors** (`relation "axes_accessattempt" does not exist`): run `make backend-migrate`
4. After dependency or Dockerfile changes: `make dev-down && make dev-up` (rebuild)
5. Verify:
   - `curl -s http://localhost:8000/api/health/` → `{"status":"ok"}`
   - `curl -s http://localhost:8080/api/hello/` → JSON hello message

## Frontend cannot reach backend

Checklist:

- `NEXT_PUBLIC_BACKEND_MAIN_API_URL` points to a URL reachable **from the browser** (not `http://backend:8000` unless you truly intend that)
- **Docker dev via Nginx (`http://localhost:8080`)**: set `NEXT_PUBLIC_BACKEND_MAIN_API_URL=http://localhost:8080` so `/api/*` is proxied by Nginx (recommended; `docker-compose.dev.yml` sets this for frontend containers)
- **Direct Next on `:3000` / `:3001`**: use `http://localhost:8000` or still use `http://localhost:8080` for the API
- After changing `NEXT_PUBLIC_*`, restart frontend containers (`make dev-down && make dev-up`)

## CORS issues

Symptoms: browser blocks API calls with CORS errors.

Fix:

- Ensure `CORS_ALLOWED_ORIGINS` includes the exact browser origin (scheme + host + port)
- Include Nginx origin if you browse via `http://localhost:8080`
- Production requires `https://` origins only in `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` (no `http://127.0.0.1` or `http://backend`)
- Deploy health checks use `ALLOWED_HOSTS` and `HEALTH_CHECK_HTTP_HOST`, not CORS/CSRF trusted origins
- `CORS_ALLOW_CREDENTIALS` must be `true` for the Next admin app (session cookies). The main app still omits credentials on API calls.
- Include `http://localhost:3001` (and `127.0.0.1:3001`) in dev `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`

## CSRF issues

Symptoms: `403 Forbidden` on POST/PUT from the browser with CSRF failure.

Fix:

- Add the browser origin to `CSRF_TRUSTED_ORIGINS` (scheme + host + port)
- For the Next admin app, call `GET /api/admin/auth/csrf/` first; `backendAdminApi` sends `X-CSRFToken` on unsafe requests
- For Django HTML admin, include the CSRF token (`csrftoken` cookie + `X-CSRFToken` header or form field)

## Next admin sign-in issues

| Symptom | Likely cause | Fix |
| ------- | ------------- | --- |
| Invalid login (generic message) | Wrong password, inactive user, or non-superuser | `make backend-createsuperuser` or `make backend-sync-superusers`; confirm `is_superuser=True` |
| Forgot admin password | Need one-time reset | `make backend-reset-user-password` (dev) or `make prod-reset-user-password` (prod); share password securely |
| `ADMIN_SUPERUSERS` sync fails | Invalid JSON or missing password for new user | Fix JSON in env file; see [`environment-variables.md`](environment-variables.md) |
| `make *-sync-superusers` cannot find container | Stack not running | Dev: `make dev-up`; prod: `make prod-up` |
| Permission denied after sign-in | User is staff but not superuser | Use a superuser account |
| CSRF / 403 on login or logout | Missing CSRF bootstrap or origin not trusted | Check `CSRF_TRUSTED_ORIGINS`; ensure `ensureAdminCsrf()` runs before POST |
| CORS error from `:3001` | API origin not allowlisted | Add admin origin to `CORS_ALLOWED_ORIGINS`; keep `CORS_ALLOW_CREDENTIALS=true` |
| Session expired / 401 on `/` | Session ended or cookies blocked | Sign in again; check third-party cookie settings |
| API unreachable | Wrong `NEXT_PUBLIC_BACKEND_MAIN_API_URL` | Use `http://localhost:8080` when using dev Nginx (see `infra/env/dev/.env.example`) |

## Rate limiting (429)

Symptoms: API returns `429 Too Many Requests` or Nginx access log shows `limiting requests`.

Fix:

- DRF throttles: tune `DRF_THROTTLE_ANON` / `DRF_THROTTLE_API` in `.env`
- `/api/health/` is exempt from DRF throttling (deploy checks should keep working)
- Nginx edge limits: see `infra/nginx/snippets/rate-limit.conf` (prod) or `rate-limit-dev.conf` (dev). Prod uses real client IPs from Cloudflare (`real-ip-cloudflare.conf`); ensure traffic reaches Nginx only via Cloudflare
- Clear throttle counters by waiting for the window to expire, or flush Redis if needed

## Django admin lockout (django-axes)

Symptoms: `403` on `/admin/login/` after repeated failed attempts.

Fix:

- Wait for `AXES_COOLOFF_MINUTES` (default 30) or raise `AXES_FAILURE_LIMIT` in non-production
- Reset via Django shell: `python manage.py axes_reset` (if installed) or flush axes keys in Redis cache
- Ensure legitimate traffic is not sharing one NAT IP with attackers

## CSP violations

Symptoms: browser console reports Content-Security-Policy blocks; admin styles/scripts break.

Fix:

- Set `CSP_REPORT_ONLY=true` on staging to collect reports without blocking
- Django admin CSP is in `config/settings/security.py`; API routes under `/api/` are excluded
- Next.js CSP is in `packages/shared/src/security/headers.mjs` — tightening may require nonce-based scripts

## Migration issues

Symptoms: `django.db.migrations.exceptions...` or “relation does not exist”.

**Development:**

- Backend startup runs `wait_for_db` then `migrate --noinput`. If the container exits immediately, check logs: `make dev-logs`
- Message about missing migration files → `make backend-makemigrations`, then restart
- `make backend-migrate` for a manual apply
- `make backend-check-migrations` before pushing (same as CI)

**Production deploy failed during release tasks:**

- Deploy stops before updating `.current_deployment`. Read the SSH / Actions log for `backend-release-tasks` or `migrate` / `collectstatic` errors
- Fix migration files in git, redeploy, or run `make prod-migrate` on the VM only if you understand the schema state
- Production never auto-generates migrations

**Database not ready:**

- Symptoms: `[backend] Database not ready after …` or `wait_for_db` timeout
- Ensure `postgres` is healthy: `docker compose … ps postgres`
- Check `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB` in the env file match the running stack

## Static files (production admin CSS missing)

Symptoms: Django admin loads without styles in production.

Fix:

- Deploy runs `collectstatic` automatically. If you skipped deploy, run `make prod-collectstatic`
- Static files live in the `backend_staticfiles` volume; a new volume on first deploy after this change is populated on the next successful release tasks run

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
