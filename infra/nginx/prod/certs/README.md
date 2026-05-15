Place **TLS certificate material** for production Nginx here.

Expected filenames (referenced by the rendered `infra/nginx/prod/conf.d/default.conf`):

- `origin.crt` — certificate (PEM)
- `origin.key` — private key (PEM)

These files are **gitignored**. Use the `.gitkeep` in this directory so the folder exists in the repo, and generate real certs in your environment (e.g. ACME, your cloud provider, or a local mkcert for experiments).

Never commit real private keys.
