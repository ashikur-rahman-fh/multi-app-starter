# Development Nginx (HTTP)

This configuration proxies:

- `/` to the main Next.js app
- `/api/` and `/static/` to the Django backend
- `/admin/` to the **Django** admin (not the Next admin app)

The Next admin shell runs on **http://localhost:3001/** (dedicated port), not through this Nginx host.

Listen port inside the container: **80** (mapped to host `8080` in [`infra/docker/compose/docker-compose.dev.yml`](../../docker/compose/docker-compose.dev.yml)).
