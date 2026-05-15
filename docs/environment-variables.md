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
| `ALLOWED_HOSTS`          | Comma-separated hostnames Django will accept.                       |
| `CSRF_TRUSTED_ORIGINS`   | Comma-separated origins trusted for CSRF (include scheme and port). |
| `CORS_ALLOWED_ORIGINS`   | Comma-separated origins allowed by `django-cors-headers`.           |

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
| `NEXT_PUBLIC_API_BASE_URL` | Browser-accessible API base URL used by `@starter/shared` fetch helpers.                                                                                        |
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
