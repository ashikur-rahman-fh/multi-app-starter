# Deploy scripts (VM)

Used by GitHub Actions **Deploy to VM** via SSH and by **`make prod-deploy`** on the server. See [`docs/runbook-docker-deploy.md`](../../../docs/runbook-docker-deploy.md).

| Script | Purpose |
| ------ | ------- |
| [`load-deploy-env.sh`](load-deploy-env.sh) | Load deploy settings from `infra/env/prod/.env` (sourced by `vm-deploy.sh`; CI env vars take precedence) |
| [`backend-release-tasks.sh`](backend-release-tasks.sh) | One-off `compose run` jobs: `wait_for_db`, migration plan/check/apply, `collectstatic` (before app restart) |
| [`vm-deploy.sh`](vm-deploy.sh) | Backup → git sync → **render Nginx from `.env`** → registry login → pull → **backend release tasks** → `up -d --no-build` → health checks |
| [`backup-database.sh`](backup-database.sh) | Timestamped PostgreSQL backup before container changes (skipped if `postgres` is not running, unless `DB_BACKUP_COMMAND` is set) |
| [`health-check.sh`](health-check.sh) | Post-deploy container and `/api/health/` checks |

## Manual deploy

On the VM (from repo root), after `infra/env/prod/.env` includes deploy keys (`DOCKER_REPO`, `BRANCH_SLUG`, `DOCKER_USERNAME`, `DOCKER_TOKEN`):

```bash
make prod-deploy IMAGE_TAG=staging-260516-1
make prod-rollback
```

Optional: `SKIP_GIT_SYNC=1`, `GIT_REF=master` (env or `.env`).

Optional tuning: `HEALTH_CHECK_MAX_WAIT`, `HEALTH_CHECK_INTERVAL`, `HEALTH_CHECK_HTTP_HOST` (must match Django `ALLOWED_HOSTS`; default `backend`).
