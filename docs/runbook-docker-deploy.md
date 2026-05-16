# Docker deploy runbook

Use this guide to publish new Docker images by pushing a **deployment branch**. It is written for **everyone** — release managers, QA, and developers.

---

## Start here (30 seconds)

1. Create a branch with a **specific name** (see [Branch naming](#branch-naming-cheat-sheet)).
2. **Push** that branch to GitHub.
3. GitHub automatically **runs all tests**, then **verifies both frontends production-build**.
4. If those pass, GitHub **builds and uploads** four Docker images to your registry.
5. Then GitHub **SSHs to your VM**, backs up the database, pulls those exact images, and restarts the app.
6. If any step fails, later steps do not run (no deploy after a failed push).

**First time?** Complete [One-time GitHub setup](#one-time-github-setup) and [VM one-time bootstrap](#vm-one-time-bootstrap) before your first deploy.

---

## Choose your path

| I want to… | Go to |
| ---------- | ----- |
| Deploy to **staging** (safe test environment) | [Staging deploy checklist](#staging-deploy-checklist) |
| Deploy to **production** | [Production deploy checklist](#production-deploy-checklist) |
| Set up GitHub (admin, one-time) | [One-time GitHub setup](#one-time-github-setup) |
| Prepare a server (VM) | [VM one-time bootstrap](#vm-one-time-bootstrap) |
| Roll back after a bad deploy | [Manual rollback](#manual-rollback) |
| Understand what failed | [If something fails](#if-something-fails) |
| Use git commands (developers) | [Appendix: For developers](#appendix-for-developers) |

---

## Glossary

| Term | Meaning |
| ---- | ------- |
| **Branch** | A named line of code in Git (like a folder label for a version). |
| **Deployment branch** | A special branch name (`staging_…` or `release_…`) that triggers the deploy workflow. |
| **Workflow** | An automated job on GitHub (like a robot that runs tests and builds images). |
| **Docker image** | A packaged copy of an app that servers can run. |
| **Tag** | A label on an image (for example `staging-260515-1`). |
| **GitHub Environment** | A settings bucket in GitHub that holds secrets (passwords) and variables (non-secret config) for staging or production. |
| **Staging** | Pre-production; use this to test deploys safely. |
| **Release / production** | Live production deploys. |
| **VM / server** | The machine where the app runs (staging or production). |
| **SSH** | Secure remote login used by GitHub to run deploy commands on the VM. |

---

## Branch naming cheat sheet

Deployment branches **must** follow one of these patterns:

| Type | Pattern | Example |
| ---- | ------- | ------- |
| Staging | `staging_YYMMDD_N` | `staging_260515_1` |
| Production | `release_YYMMDD_N` | `release_260515_1` |

- **YYMMDD** = date (6 digits). Example: 15 May 2026 → `260515`
- **N** = deployment number **for that day** (1, 2, 3, …)

### Valid examples

- `staging_260515_1` — first staging deploy on 15 May 2026
- `staging_260515_2` — second staging deploy that same day
- `release_260515_1` — first production deploy on 15 May 2026

### Invalid examples (workflow will fail)

- `staging-260515-1` (wrong separators — use underscores)
- `staging_2026_05_15_1` (wrong date format)
- `release_260515` (missing deployment number)
- `main`, `master`, `develop` (not deployment branches)

---

## What happens automatically

When you push a valid deployment branch, GitHub runs workflow **Docker Deploy Branches**:

```text
Push branch → Validate → Tests → Frontend builds → Build/push images → Backup DB on VM → Pull exact tag → Restart → Health check
```

| Step | What it does |
| ---- | ------------- |
| **Validate** | Checks the branch name; picks `staging_env` or `release_env`. |
| **Test** | Runs the same full test suite as `make test` (backend, frontends, quality checks). |
| **Verify frontend production builds** | Builds **frontend-main** and **frontend-admin** for production, using `NEXT_PUBLIC_API_BASE_URL` from the GitHub Environment. |
| **Build and push** | Builds and uploads four images with an **immutable tag** (e.g. `staging-260515-1`). Also pushes `-latest`, but deploy uses the immutable tag only. |
| **Deploy to VM** | SSH to the environment’s VM, **backup database first**, pull images, `docker compose up -d --no-build`, health checks, update `.current_deployment`. |

**Important:** If tests, builds, push, or health checks fail, the workflow stops. If the default database backup **runs** and fails (e.g. empty dump), deploy stops. If Postgres is **not** running, backup is **skipped** and deploy continues.

**Deploy queue:** Only one deploy runs per GitHub Environment (`staging_env` or `release_env`) at a time, so two staging branches cannot update the same VM simultaneously.

---

## Staging deploy checklist

Use staging to test the process before production.

### Before you start

- [ ] One-time GitHub setup is done for **`staging_env`** (see below).
- [ ] Staging **VM is bootstrapped** (see [VM one-time bootstrap](#vm-one-time-bootstrap)).
- [ ] The code you want to deploy is merged or ready on the branch you will deploy from (usually `master`).
- [ ] (Optional) Ask a developer to run `make test` and `make build` locally — catches test and production-build issues earlier.

### Steps

1. **Pick today’s date** in `YYMMDD` format (example: 15 May 2026 → `260515`).

2. **Pick the deployment number** for today (`1` for first deploy, `2` for second, etc.).

3. **Create the branch name:** `staging_YYMMDD_N` (example: `staging_260515_1`).

4. **Create and push the branch.**

   **On GitHub (website):**

   - Open the repository → **Code** → branch dropdown → type the new branch name → **Create branch**.

   **Or with git (developers):**

   ```bash
   git checkout master
   git pull
   git checkout -b staging_260515_1
   git push -u origin staging_260515_1
   ```

5. **Watch the workflow.**

   - Repository → **Actions** → workflow **Docker Deploy Branches** → open the latest run.
   - Wait until all jobs show a green checkmark.

6. **Verify** registry images and VM deployment (see [How to check it worked](#how-to-check-it-worked)).

---

## Production deploy checklist

Same as staging, but use a **`release_`** branch and **`release_env`**.

### Before you start

- [ ] Staging deploy has been tested successfully (recommended).
- [ ] One-time GitHub setup is done for **`release_env`**.
- [ ] Production **VM is bootstrapped**.
- [ ] You have approval to deploy to production (your team’s process).

### Steps

1. Pick date → `YYMMDD` (example: `260515`).
2. Pick deployment number → `N` (example: `1`).
3. Branch name: `release_260515_1` (not `staging_…`).
4. Create and push the branch (same as staging, but with `release_` prefix).
5. Open **Actions** and confirm the workflow succeeded.
6. Verify images on your Docker registry (tags use `release-…` not `staging-…`).

---

## One-time GitHub setup

A repository admin configures this once per environment.

### Create environments

1. Open the repository on GitHub.
2. **Settings** → **Environments**.
3. Click **New environment**.
4. Create **`staging_env`** — repeat for **`release_env`**.

You can add protection rules (required reviewers) on `release_env` if your team uses them.

### Add secrets (private — never commit to git)

For **each** environment (`staging_env` and `release_env`), add:

| Secret name | What to put |
| ----------- | ----------- |
| `DOCKER_USERNAME` | Your Docker Hub (or registry) username |
| `DOCKER_PASSWORD` **or** `DOCKER_TOKEN` | Password or access token (token is preferred) |
| `VM_HOST` | Staging or production server IP or hostname |
| `VM_USER` | SSH username on the VM |
| `VM_SSH_KEY` | Private SSH key (PEM) for `VM_USER` |
| `VM_SSH_PORT` | SSH port (usually `22`) |

**How:** Environment → **Environment secrets** → **Add secret**

**Security:** `staging_env` and `release_env` must use **different** `VM_HOST` values so staging never deploys to production.

### Add variables (non-secret config)

For **each** environment, add:

| Variable name | `staging_env` example | `release_env` example |
| ------------- | --------------------- | --------------------- |
| `DOCKER_REPO` | `myorg/my-starter-app` | `myorg/my-starter-app` |
| `BRANCH_SLUG` | `staging` | `release` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.staging.example.com` | `https://api.example.com` |
| `NEXT_PUBLIC_BASE_PATH` | *(leave empty)* | *(leave empty)* |
| `DEPLOY_PATH` | `/opt/multi-app-starter` | `/opt/multi-app-starter` |
| `COMPOSE_FILE` | `infra/docker/compose/docker-compose.prod.yml` | same |
| `BACKUP_DIR` | `/var/backups/multi-app-starter` | `/var/backups/multi-app-starter` |
| `APP_DOMAIN` | `api.staging.example.com` | `api.example.com` |

**How:** Environment → **Environment variables** → **Add variable**

With [GitHub CLI](https://cli.github.com/) (`gh`), for example:

```bash
gh variable set NEXT_PUBLIC_API_BASE_URL --env staging_env --body 'https://api.staging.example.com'
gh variable set NEXT_PUBLIC_BASE_PATH --env staging_env --body ''
gh variable set APP_DOMAIN --env staging_env --body 'api.staging.example.com'
```

Use your real public API hostname (any domain). **No leading or trailing spaces** in the value — a leading space before `https://` will fail CI validation.

Repeat for `release_env` when using production. `NEXT_PUBLIC_BASE_PATH` must be empty when frontends use separate hostnames (not path-based routing).

| Variable | Required? |
| -------- | ----------- |
| `DOCKER_REPO` | Yes |
| `BRANCH_SLUG` | Yes — must be `staging` in `staging_env` and `release` in `release_env` |
| `NEXT_PUBLIC_API_BASE_URL` | Yes — **public API URL in the browser** (e.g. `https://api.starter.com`), not `http://backend:8000` |
| `DEPLOY_PATH` | Yes — full git clone path on the VM |
| `COMPOSE_FILE` | Optional — defaults to `infra/docker/compose/docker-compose.prod.yml` |
| `NEXT_PUBLIC_BASE_PATH` | Optional (usually empty in production; leave unset or blank — not `/app-admin`, which is dev-only) |
| `BACKUP_DIR` | Optional — defaults to `/var/backups/<PROJECT_NAME>` on VM |
| `DB_SERVICE_NAME` | Optional — defaults to `postgres` |
| `DB_BACKUP_COMMAND` | Optional — custom backup shell command; empty = default PostgreSQL `pg_dump` |
| `APP_DOMAIN` | Optional — public HTTPS health check after deploy |

### Which environment is used?

| Branch prefix | GitHub Environment |
| ------------- | ------------------ |
| `staging_…` | `staging_env` |
| `release_…` | `release_env` |

The workflow picks this automatically from the branch name.

---

## Docker image naming and tags

Assume:

- `DOCKER_REPO` = `myorg/my-starter-app`
- Branch = `staging_260515_1`
- `BRANCH_SLUG` = `staging`

Images are published as **four repositories** (one per app):

| App | Image name |
| --- | ---------- |
| Backend | `myorg/my-starter-app-backend` |
| Main frontend | `myorg/my-starter-app-frontend-main` |
| Admin frontend | `myorg/my-starter-app-frontend-admin` |
| Nginx | `myorg/my-starter-app-nginx` |

Each image gets **two tags** for every deploy:

| Tag | Example |
| --- | ------- |
| Version tag | `staging-260515-1` |
| Latest for that environment | `staging-latest` |

Full example:

```text
myorg/my-starter-app-backend:staging-260515-1
myorg/my-starter-app-backend:staging-latest
```

For a **release** branch `release_260515_1`, tags use `release-260515-1` and `release-latest`.

### How the deploy tag is chosen (immutable)

| Branch | `IMAGE_TAG` used on VM |
| ------ | ---------------------- |
| `staging_260515_1` | `staging-260515-1` |
| `release_260515_1` | `release-260515-1` |

The VM **never** deploys using `-latest` alone. It always pulls `${DOCKER_REPO}-backend:staging-260515-1` (etc.) matching the current pipeline run.

---

## VM one-time bootstrap

Do this once per server (staging VM and production VM separately).

**Important:** The **Deploy to VM** job runs on the server you set in `VM_HOST` (over SSH). Your laptop can have `infra/env/prod/.env`, but the deploy will still fail until that file exists **inside `DEPLOY_PATH` on the VM** (e.g. `/home/.../deployment/multi-app-starter/infra/env/prod/.env`).

1. Install **Docker** and **Docker Compose v2**.
2. Add the deploy user to the `docker` group.
3. **Clone this repository** to `DEPLOY_PATH` (e.g. `/opt/multi-app-starter`).
4. Copy environment file (`cp infra/env/prod/.env.example infra/env/prod/.env`) and edit values for this server. **Do not commit `.env`.**
5. Set `MAIN_FRONTEND_HOST`, `MAIN_FRONTEND_WWW_HOST`, `ADMIN_FRONTEND_HOST`, and `API_HOST` in `.env` (deploy re-renders Nginx from these automatically). After changing security-related Nginx settings or `CLIENT_MAX_BODY_SIZE`, run `make prod-nginx-config` on the VM and restart the nginx container so `infra/nginx/snippets/` and the rendered vhost are picked up.
6. Set registry deploy keys in the same `.env` for manual deploy: `DOCKER_REPO`, `BRANCH_SLUG`, `DOCKER_USERNAME`, `DOCKER_TOKEN`, `BACKUP_DIR`, `COMPOSE_PROJECT_NAME` (keep `starter-prod` if containers already use that prefix), `APP_DOMAIN` / `API_HOST` (mirror GitHub Environment variables).
7. Add TLS certificates under `infra/nginx/prod/certs/` if using HTTPS.
8. Install `envsubst` if missing: `sudo apt install gettext-base`
9. Create backup directory (or let the deploy script create it with mode `700`):

   ```bash
   sudo mkdir -p /var/backups/multi-app-starter && sudo chown $USER:$USER /var/backups/multi-app-starter
   ```
10. Authorize the GitHub deploy **SSH public key** for `VM_USER` in `~/.ssh/authorized_keys`.
11. (First deploy) If Postgres is not running yet, the deploy will **skip** the DB backup and still pull images and start the stack. Later deploys will dump once Postgres is healthy.

### Cloudflare + rate limiting

Production Nginx restores the visitor IP from Cloudflare before applying rate limits:

- Config: `infra/nginx/snippets/real-ip-cloudflare.conf` and `cloudflare-ips.conf`
- **Require** HTTPS traffic on port 443 to reach the VM only from Cloudflare IPs (firewall / security group). Otherwise clients can spoof `CF-Connecting-IP` on direct connections.
- Refresh `cloudflare-ips.conf` when [Cloudflare publishes IP range changes](https://www.cloudflare.com/ips-v4/).
- After updating snippets or rendered vhost config: `make prod-nginx-config` (if needed) and restart the nginx container.

---

## Database backup (before every deploy)

Before stopping or updating containers, the deploy script on the VM runs [`infra/scripts/deploy/backup-database.sh`](../infra/scripts/deploy/backup-database.sh).

| Item | Default |
| ---- | ------- |
| Database | PostgreSQL service **`postgres`** in prod Compose |
| Backup directory | `/var/backups/multi-app-starter/` (or `BACKUP_DIR`) |
| File name | `{BRANCH_SLUG}_db_backup_YYYYMMDD_HHMMSS.sql` |
| Example | `staging_db_backup_20260515_143000.sql` |

Passwords come from `infra/env/prod/.env` on the VM — **not** from GitHub Actions logs.

**When Postgres is not running** (first deploy, or stack stopped): the default backup is **skipped** and the deploy continues. Once `postgres` is up, the next deploy will create a dump as usual.

**Custom backup:** set variable `DB_BACKUP_COMMAND` to a full shell command (for MySQL or other tools). It must create a non-empty backup file and exit with code `0`. Failures still stop the deploy.

If a **default** `pg_dump` backup runs and fails (empty file, exec error) → deploy **stops immediately** (no image pull, no restart).

---

## Manual deploy and rollback (registry images on the VM)

One-time: add registry deploy settings to **`infra/env/prod/.env` on the VM** (same names as GitHub `staging_env` / `release_env`): `DOCKER_REPO`, `BRANCH_SLUG`, `DOCKER_USERNAME`, `DOCKER_TOKEN`, `BACKUP_DIR`, `APP_DOMAIN`. See [`infra/env/prod/.env.example`](../infra/env/prod/.env.example).

| Command | Purpose |
| ------- | ------- |
| `make prod-deploy IMAGE_TAG=staging-260516-1` | Pull that tag, backup DB, render nginx, restart, health check |
| `make prod-rollback` | Deploy the tag in `.previous_deployment` |
| `make prod-up` | **Local build** from source (not registry rollback) |

Optional:

- `GIT_REF=master make prod-deploy IMAGE_TAG=...` — sync repo before deploy (or set `GIT_REF` in `.env`)
- `SKIP_GIT_SYNC=1 make prod-deploy IMAGE_TAG=...` — image-only, no `git pull`

After a successful deploy, the VM stores tags in `DEPLOY_PATH`:

| File | Meaning |
| ---- | ------- |
| `.current_deployment` | Tag that is live now (e.g. `staging-260515-2`) |
| `.previous_deployment` | Tag from the deploy before last (e.g. `staging-260515-1`) |

**Advanced:** `bash infra/scripts/deploy/vm-deploy.sh` with env vars exported (GitHub Actions uses this; manual deploy can rely on `.env` via [`load-deploy-env.sh`](../infra/scripts/deploy/load-deploy-env.sh)).

Or push a **new** deployment branch after fixing the code (preferred for forward fixes).

---

## How to check it worked

### 1. GitHub Actions

1. Repository → **Actions**
2. Open **Docker Deploy Branches**
3. Confirm all jobs succeeded, including **Deploy to VM**.

### 2. Docker registry

Log in to Docker Hub (or your registry) and look for the four image names above with the expected tags.

### 3. Quick sanity check

- Staging branch → tags start with `staging-`
- Release branch → tags start with `release-`

### 4. On the VM

```bash
cd /opt/multi-app-starter   # your DEPLOY_PATH
cat .current_deployment     # should match IMAGE_TAG from Actions (e.g. staging-260515-1)
docker compose --project-directory . --env-file infra/env/prod/.env \
  -f infra/docker/compose/docker-compose.prod.yml ps
```

Optional: open your site or `https://<APP_DOMAIN>/api/health/` in a browser.

---

## If something fails

| What you see | What it means | What to do |
| ------------ | ------------- | ---------- |
| Red X on **Run full test suite** | Tests failed | **No new images were published** (by design). Open the failed job → read the log → fix the code → push again. |
| Red X on **Verify frontend production builds** | A Next.js production build failed | **No new images were published.** Check the build log. Fix and push again. |
| Red X on **Deploy to VM** | SSH, backup, pull, or health check failed | **VM may be unchanged** if backup failed early. Open the deploy log. See [troubleshooting](#when-things-go-wrong-quick-reference). |
| Red X on **Build and push** | Registry push failed | Deploy does not run. Fix credentials and re-run. |
| Red X on **Validate branch name** | Branch name is wrong | Rename or recreate the branch using the [cheat sheet](#branch-naming-cheat-sheet). |
| Red X on **Verify required Docker configuration** | Missing secret or variable | Complete [One-time GitHub setup](#one-time-github-setup). |
| `BRANCH_SLUG does not match` | Wrong slug in environment | Set `BRANCH_SLUG=staging` in `staging_env` and `BRANCH_SLUG=release` in `release_env`. |

Contact a developer with the link to the failed Actions run if you need help reading the logs.

---

## Before your first real deploy (safe test)

1. Bootstrap the **staging VM** and configure **`staging_env`** only.
2. Push a **staging** branch (for example `staging_260515_1`).
3. Confirm Actions is green, images exist in the registry, and `.current_deployment` on the VM shows `staging-260515-1`.
4. Only then set up **`release_env`**, bootstrap the **production VM**, and push a **release** branch.

---

## When things go wrong (quick reference)

| Symptom | Likely cause | What to do |
| ------- | ------------- | ---------- |
| Workflow does not start | Branch name does not match `staging_*` or `release_*` glob | Use exact pattern `staging_YYMMDD_N` |
| “Invalid deployment branch name” | Typo in branch name | Fix naming; see [cheat sheet](#branch-naming-cheat-sheet) |
| Build job skipped | Tests or frontend builds failed | Fix tests or production build errors first |
| Login to registry failed | Bad `DOCKER_USERNAME` / token | Update secrets in the correct Environment |
| Frontend build failed | Missing `NEXT_PUBLIC_API_BASE_URL` | Add variable to Environment |
| Hello/API fetch URL contains `NEXT_PUBLIC_BASE_PATH=` | Docker `build-args` merged into one value (bad `format('\n')` in workflow) | Use multiline `build-args` in `docker-deploy-branches.yml`; rebuild frontend images and redeploy |
| “Missing env file on the deployment server” | `infra/env/prod/.env` missing **on the VM** at `DEPLOY_PATH` | SSH to `VM_HOST`, `cd` to `DEPLOY_PATH`, run `cp infra/env/prod/.env.example infra/env/prod/.env` and edit |
| Deploy SSH failed | Wrong `VM_HOST`, key, or port | Fix secrets in correct Environment |
| Backup failed | Postgres not running | **Skipped** by default; deploy continues. If you use `DB_BACKUP_COMMAND`, fix that command. |
| Backup failed | `database "…" does not exist` | `POSTGRES_DB` in `.env` does not match the DB created when the Postgres **volume** was first initialized. List DBs: `compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c '\l'` (credentials from `.env`). Either set `POSTGRES_DB` to the existing name or `CREATE DATABASE` + `make prod-migrate`. |
| Backup failed | `pg_dump` error or empty dump while Postgres is running | Check DB credentials in VM `.env`, disk space, `BACKUP_DIR` permissions |
| Health check failed | HTTP **400** from `/api/health/` | **DisallowedHost**: urllib used `Host: 127.0.0.1`, which must be in `ALLOWED_HOSTS`. Add `127.0.0.1` and/or keep `backend`, or set `HEALTH_CHECK_HTTP_HOST` to an allowed API hostname on the VM. |
| Health check failed | Backend **timeout** | Retries run up to 120s. Run `docker compose logs backend --tail 80`. Ensure secrets are not `change-me…` placeholders in prod. |
| Health check failed | Containers unhealthy or wrong `APP_DOMAIN` | SSH to VM, run `docker compose ps` and deploy logs |
| Wrong server updated | Same `VM_HOST` in staging and release | Use separate IPs per Environment |

For local Docker issues (not deploy workflow), see [`runbook-troubleshooting.md`](runbook-troubleshooting.md).

---

## Appendix: For developers

### Workflow file

[`.github/workflows/docker-deploy-branches.yml`](../.github/workflows/docker-deploy-branches.yml)

### Run tests and frontend builds locally (same as CI)

```bash
cp infra/env/test/.env.example infra/env/test/.env
make test
```

Production frontend builds (requires `NEXT_PUBLIC_API_BASE_URL` in your shell or `.env`):

```bash
export NEXT_PUBLIC_API_BASE_URL=https://api.staging.example.com   # match your Environment
make build
```

### Create a deployment branch (git)

```bash
git checkout master && git pull
git checkout -b staging_260515_1   # or release_260515_1
git push -u origin HEAD
```

### Branch validation (regex)

- Staging: `^staging_[0-9]{6}_[0-9]+$`
- Release: `^release_[0-9]{6}_[0-9]+$`

Deploy version for tags: `staging_260515_1` → `260515-1` (used in image tags).

### Deploy scripts on the VM

| Script | Purpose |
| ------ | ------- |
| [`infra/scripts/deploy/vm-deploy.sh`](../infra/scripts/deploy/vm-deploy.sh) | Full deploy orchestration |
| [`infra/scripts/deploy/backup-database.sh`](../infra/scripts/deploy/backup-database.sh) | Pre-deploy DB backup |
| [`infra/scripts/deploy/health-check.sh`](../infra/scripts/deploy/health-check.sh) | Post-deploy checks |

Compose overlay for registry pulls: [`infra/docker/compose/docker-compose.deploy.yml`](../infra/docker/compose/docker-compose.deploy.yml) (merged with prod compose; **not** used for `make prod-up`).

### Environment secrets and variables (full list)

| Name | Type | Purpose |
| ---- | ---- | ------- |
| `DOCKER_USERNAME` | Secret | Registry login (build + VM) |
| `DOCKER_PASSWORD` / `DOCKER_TOKEN` | Secret | Registry token |
| `VM_HOST` | Secret | Target VM |
| `VM_USER` | Secret | SSH user |
| `VM_SSH_KEY` | Secret | SSH private key |
| `VM_SSH_PORT` | Secret | SSH port (e.g. `22`) |
| `DOCKER_REPO` | Variable | Image base name |
| `BRANCH_SLUG` | Variable | `staging` or `release` |
| `DEPLOY_PATH` | Variable | Repo path on VM |
| `COMPOSE_FILE` | Variable | Prod compose path |
| `NEXT_PUBLIC_API_BASE_URL` | Variable | Browser-facing API URL at build time |
| `NEXT_PUBLIC_BASE_PATH` | Variable | Optional Next base path |
| `BACKUP_DIR` | Variable | Backup directory on VM |
| `DB_SERVICE_NAME` | Variable | DB service name (default `postgres`) |
| `DB_BACKUP_COMMAND` | Variable | Optional custom backup command |
| `APP_DOMAIN` | Variable | Optional public health host |

### Add another Docker image later

1. Add a production `Dockerfile` under `infra/docker/<service>/`.
2. In `docker-deploy-branches.yml`, add a row to the `build-and-push` job matrix:

   ```yaml
   - image_suffix: my-service
     dockerfile: infra/docker/my-service/Dockerfile.prod
     needs_frontend_args: false   # true if it needs NEXT_PUBLIC_* build args
   ```

3. Document the new image in this runbook’s [image naming](#docker-image-naming-and-tags) table.

Images will publish as `${DOCKER_REPO}-my-service:${BRANCH_SLUG}-${version}` and `…:${BRANCH_SLUG}-latest`.

### Related docs

- [`deployment.md`](deployment.md) — local production Compose (separate from registry push)
- [`testing.md`](testing.md) — full test matrix and CI overview
