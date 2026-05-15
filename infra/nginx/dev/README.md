# Development Nginx (HTTP)

This configuration proxies:

- `/` to the main Next.js app
- `/app-admin/` to the admin Next.js app (set `NEXT_PUBLIC_BASE_PATH=/app-admin` for this app in dev so it matches Django, which uses `/admin/` for the Django admin UI)
- `/api/` and `/static/` to the Django backend
- `/admin/` to the **Django** admin (not the Next admin app)

Listen port inside the container: **80** (mapped to host `8080` in [`infra/docker/compose/docker-compose.dev.yml`](../../docker/compose/docker-compose.dev.yml)).
