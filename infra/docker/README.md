# Docker build contexts and Compose

## Compose stacks

All Compose files live under **[`infra/docker/compose/`](compose/)** (for example [`compose/docker-compose.dev.yml`](compose/docker-compose.dev.yml)). They are **not** at the repository root.

Run them with the repository root as the Compose **project directory** so paths in YAML resolve correctly:

```bash
docker compose --project-directory "$(pwd)" -f infra/docker/compose/docker-compose.dev.yml up --build
```

In practice, use the root **`Makefile`** or scripts under **`infra/scripts/`** — they pass `--project-directory` and `-f` for you.

See [`compose/README.md`](compose/README.md) for a concise layout summary.

## Dockerfiles (service images)

Images are built from the **repository root** so pnpm workspaces and shared packages resolve correctly.

| Path                                 | Role                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`backend/`](backend/)               | Django dev, prod, and test-runner Python deps                                                    |
| [`frontend-main/`](frontend-main/)   | Next.js main app                                                                                 |
| [`frontend-admin/`](frontend-admin/) | Next.js admin app                                                                                |
| [`nginx/`](nginx/)                   | Nginx reverse proxy image                                                                        |
| [`test-runner/`](test-runner/)       | Python + Node image used by [`compose/docker-compose.test.yml`](compose/docker-compose.test.yml) |
