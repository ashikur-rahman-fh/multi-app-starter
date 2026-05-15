# Production Nginx (HTTPS)

- TLS certificates are mounted from `./infra/nginx/prod/certs` to `/etc/nginx/certs` (read-only).
- HTTP on port 80 redirects to HTTPS.
- Host-based routing (hostnames from `infra/env/prod/.env`):
  - `MAIN_FRONTEND_HOST` / `MAIN_FRONTEND_WWW_HOST` → main frontend
  - `ADMIN_FRONTEND_HOST` → admin frontend
  - `API_HOST` → Django (including `/admin/` for Django admin)

`conf.d/default.conf` is **generated** — not committed. Edit `.env`, then render:

```bash
make prod-nginx-config
# or: bash infra/scripts/nginx/render-prod-config.sh
```

This writes `conf.d/default.conf` from `conf.d/default.conf.template`. Deploy (`vm-deploy.sh` / `make prod-deploy`) runs the same step automatically.

Requires `envsubst` on the server (`apt install gettext-base`).
