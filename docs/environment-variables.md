# Environment variables

This document explains the variables referenced by `infra/env/*/.env.example`.

Values are examples. Generate strong secrets for anything security-sensitive.

## Project / Django core

| Variable                 | Purpose                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| `PROJECT_NAME`           | Human-friendly project label (used in docs/scripts as needed).      |
| `ENVIRONMENT`            | Logical environment name (`dev`, `test`, `prod`).                   |
| `DEBUG`                  | Django `DEBUG` flag (`true`/`false`).                               |
| `SECRET_KEY`             | Django secret key. Must be unique per environment. In production (`config.settings.prod`), placeholder values starting with `change-me` are rejected — set a real value in `infra/env/prod/.env` or the deployment environment. |
| `DJANGO_SETTINGS_MODULE` | Django settings module path (for example `config.settings.dev`).    |
| `ALLOWED_HOSTS`          | Comma-separated hostnames Django accepts in the `Host` header (e.g. public API host, `backend`, `127.0.0.1` for in-container health checks). Separate from CORS/CSRF. |
| `CSRF_TRUSTED_ORIGINS`   | Comma-separated browser origins trusted for CSRF (scheme + host + port). Production: `https://` only. |
| `CORS_ALLOWED_ORIGINS`   | Comma-separated browser origins allowed by `django-cors-headers`. Production: `https://` only. |

## Security

| Variable                | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `DRF_THROTTLE_ANON`     | DRF anonymous throttle rate (default `100/hour`).                       |
| `DRF_THROTTLE_API`      | DRF scoped API throttle rate (default `200/hour`). `/api/health/` is exempt. |
| `DRF_THROTTLE_ADMIN_LOGIN` | Throttle rate for `POST /api/admin/auth/login/` (default `10/minute`). |
| `CORS_ALLOW_CREDENTIALS` | When `true` (default), browsers may send cookies to the API from allowed origins. Required for Next admin session auth. Main app still uses `withCredentials: false`. |
| `AXES_FAILURE_LIMIT`    | Failed Django admin logins before lockout (default `5`).                |
| `AXES_COOLOFF_MINUTES`  | Admin lockout duration in minutes (default `30`).                         |
| `DATA_UPLOAD_MAX_BYTES` | Django in-memory upload cap in bytes (default `2621440` / 2.5 MiB).     |
| `DATA_UPLOAD_MAX_FIELDS`| Max form fields per request (default `1000`).                           |
| `CLIENT_MAX_BODY_SIZE`  | Nginx `client_max_body_size` (default `25m`; used when rendering prod nginx config). |
| `CSP_REPORT_ONLY`       | When `true`, Django CSP runs in report-only mode (useful on staging).   |
| `CSP_REPORT_URI`        | Optional CSP violation report endpoint URL.                           |

Nginx also applies per-IP rate limits at the edge (`infra/nginx/snippets/`). With Cloudflare in front, prod Nginx restores the client IP from `CF-Connecting-IP` before rate limiting. Health checks use a dedicated location with higher burst limits.

**Next.js CSP:** `NEXT_PUBLIC_BACKEND_MAIN_API_URL` is included in the frontend `connect-src` directive at build time (see `packages/shared/src/security/headers.mjs`).

**CSRF cookie (production):** `CSRF_COOKIE_HTTPONLY=True` prevents JavaScript from reading `csrftoken`. The Next admin app uses `GET /api/admin/auth/csrf/` and `backendAdminApi` (`X-CSRFToken`). Ensure the admin browser origin is in `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS`. `backendMainApi` remains stateless.

## Admin superuser sync (operations)

| Variable | Purpose |
| -------- | ------- |
| `ADMIN_SUPERUSERS` | JSON **array** of superuser objects to ensure exist. Required for `make *-sync-superusers`. Each object needs `username`; new users need `password`. Optional: `email`, `first_name`, `last_name`. |
| `ADMIN_SUPERUSER_UPDATE_PASSWORD` | When `true`, also set password from env for **existing** users (default `false`). |

Example (use single quotes in `.env`):

```bash
ADMIN_SUPERUSERS='[{"username":"admin","email":"admin@example.com","password":"change-me-in-env","first_name":"Admin","last_name":"User"}]'
ADMIN_SUPERUSER_UPDATE_PASSWORD=false
```

| Make command | Environment |
| ------------ | ------------- |
| `make backend-sync-superusers` | Dev |
| `make prod-sync-superusers` | Prod |
| `make test-sync-superusers` | Test compose DB |

Never commit real passwords. Prefer env sync for bootstrap and `make *-reset-user-password` for recovery.

## PostgreSQL

| Variable            | Purpose                                                                          |
| ------------------- | -------------------------------------------------------------------------------- |
| `POSTGRES_DB`       | Database name.                                                                   |
| `POSTGRES_USER`     | Database user.                                                                   |
| `POSTGRES_PASSWORD` | Database password. In production, placeholder values starting with `change-me` are rejected — set a real value in `infra/env/prod/.env` or the deployment environment. |
| `POSTGRES_HOST`     | Hostname as seen **from Django containers** (`postgres`, `postgres-test`, etc.). |
| `POSTGRES_PORT`     | Database port (usually `5432`).                                                  |

## Redis

| Variable    | Purpose                                                                          |
| ----------- | -------------------------------------------------------------------------------- |
| `REDIS_URL` | Redis URL for Django cache (`django-redis`), for example `redis://redis:6379/0`. |

## URLs used by frontends

| Variable                   | Purpose                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BACKEND_URL`              | Canonical backend base URL for documentation / non-Next consumers.                                                                                              |
| `NEXT_PUBLIC_BACKEND_MAIN_API_URL` | Browser-accessible base URL for `backendMainApi` in `@starter/shared`. **Production:** must be `https://` and your public API hostname (e.g. `https://api.starter.com`, same as `API_HOST`). Never use `http://backend:8000` or internal Docker hostnames — CI and Docker builds reject those. Included in frontend CSP `connect-src` at build time. |
| *(future)* `NEXT_PUBLIC_BACKEND_SECONDARY_API_URL` | Reserved for an additional backend client when a second API service is added. |
| `NEXT_PUBLIC_BASE_PATH`    | Optional Next `basePath` for the **admin** app when using path-based routing. Leave empty in default dev (`:3001/`) and production (separate hostnames). |

## Hostname documentation fields

Nginx production vhosts (rendered into `infra/nginx/prod/conf.d/default.conf` via `make prod-nginx-config`):

| Variable                | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `MAIN_FRONTEND_HOST`    | Main site hostname (e.g. `staging.example.com`).              |
| `MAIN_FRONTEND_WWW_HOST`| Optional `www` host; defaults to `www.${MAIN_FRONTEND_HOST}`. |
| `ADMIN_FRONTEND_HOST`   | Admin app hostname.                                           |
| `API_HOST`              | API / Django hostname.                                        |

## Docker Compose (production)

| Variable               | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `COMPOSE_PROJECT_NAME` | Compose project name (container prefix, e.g. `starter-prod`). **Do not change** after the first deploy or Postgres/Redis volumes will not match. |

## Registry deploy (VM `.env` only)

Used by `make prod-deploy` / `vm-deploy.sh` on the server (mirror GitHub Environment `staging_env` / `release_env`):

| Variable         | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `DOCKER_REPO`    | Image name prefix (tags: `{DOCKER_REPO}-backend:{IMAGE_TAG}`, etc.).   |
| `BRANCH_SLUG`    | `staging` or `release` (backup file prefix).                            |
| `DOCKER_USERNAME`| Registry login user.                                                    |
| `DOCKER_TOKEN`   | Registry password or access token (never commit).                       |
| `BACKUP_DIR`     | Database backup directory (optional; derived from `PROJECT_NAME` if unset). |
| `APP_DOMAIN`     | Public API hostname for HTTPS health check; defaults to `API_HOST` if unset. |
| `HEALTH_CHECK_HTTP_HOST` | `Host` header for in-container backend check; defaults to `API_HOST`, then `backend`. |
| `HEALTH_CHECK_PATH`      | Health URL path; default `/api/health/`.                                |
| `GIT_REF`        | Optional branch to `git pull` before deploy (e.g. `master`).            |
| `SKIP_GIT_SYNC`  | Set to `1` to skip git fetch/pull during deploy.                        |

## Debugging

| Variable            | Purpose                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `WAIT_FOR_DEBUGGER` | When `true`, debugpy starts with `--wait-for-client` so Django blocks until a debugger attaches. |
