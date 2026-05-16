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
| `AXES_FAILURE_LIMIT`    | Failed Django admin logins before lockout (default `5`).                |
| `AXES_COOLOFF_MINUTES`  | Admin lockout duration in minutes (default `30`).                         |
| `DATA_UPLOAD_MAX_BYTES` | Django in-memory upload cap in bytes (default `2621440` / 2.5 MiB).     |
| `DATA_UPLOAD_MAX_FIELDS`| Max form fields per request (default `1000`).                           |
| `CLIENT_MAX_BODY_SIZE`  | Nginx `client_max_body_size` (default `25m`; used when rendering prod nginx config). |
| `CSP_REPORT_ONLY`       | When `true`, Django CSP runs in report-only mode (useful on staging).   |
| `CSP_REPORT_URI`        | Optional CSP violation report endpoint URL.                           |

Nginx also applies per-IP rate limits at the edge (`infra/nginx/snippets/`). With Cloudflare in front, prod Nginx restores the client IP from `CF-Connecting-IP` before rate limiting. Health checks use a dedicated location with higher burst limits.

**Next.js CSP:** `NEXT_PUBLIC_API_BASE_URL` is included in the frontend `connect-src` directive at build time (see `packages/shared/src/security/headers.mjs`).

**CSRF cookie (production):** `CSRF_COOKIE_HTTPONLY=True` prevents JavaScript from reading `csrftoken`. This is fine for Django admin and today’s stateless `fetch` calls. If Next apps later use cookie/session auth, provide CSRF via a server route/BFF, or consciously set `CSRF_COOKIE_HTTPONLY=False` (weaker; requires `SameSite` + HTTPS).

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
| `NEXT_PUBLIC_API_BASE_URL` | Browser-accessible API base URL used by `@starter/shared` fetch helpers. **Production:** must be `https://` and your public API hostname (e.g. `https://api.starter.com`, same as `API_HOST`). Never use `http://backend:8000`, `localhost`, or dev ports — CI and Docker builds reject those. Included in frontend CSP `connect-src` at build time. |
| `NEXT_PUBLIC_BASE_PATH`    | Next `basePath` for the **admin** app when served under a path prefix (dev Nginx uses `/app-admin`). Usually empty in production when using separate hostnames. |

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
