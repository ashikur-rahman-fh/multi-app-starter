# Infra scripts

Shell helpers invoked from the root [`Makefile`](../../Makefile). Run them from the **repository root** unless noted.

Each script runs Docker Compose with:

- **`--project-directory`** set to the repo root (so paths inside [`infra/docker/compose/`](../docker/compose/) YAML resolve correctly)
- **`-f infra/docker/compose/docker-compose.<stack>.yml`**

| Area     | Scripts                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `dev/`   | Start/stop/logs/restart development stack; Django migrate/makemigrations/check-migrations/superuser/shell; `editor-happy.sh` (host editor deps); `install-js.sh` (Linux `node_modules` for Docker bind mounts — `make dev-install-js`) |
| `deploy/` | VM deploy, backup, health checks, **backend release tasks** (migrate + collectstatic before restart) |
| `debug/` | Same for [`infra/docker/compose/docker-compose.debug.yml`](../docker/compose/docker-compose.debug.yml) (debugpy enabled on backend) |
| `test/`  | Full suite and per-package runners (via `test-runner` service)                                                                      |
| `prod/`  | Production compose helpers                                                                                                          |
| `db/`    | Backup/restore/reset (development-oriented defaults). Scripts run Docker/postgres preflight checks and use `INFO:` / `ERROR:` messages. `db-reset` requires confirmation; set `FORCE=1` to skip the prompt. `db-restore` validates the dump path exists and is non-empty. |

See [`docs/development.md`](../../docs/development.md) for workflows.
