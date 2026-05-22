#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/compose/docker-compose.dev.yml}"

# shellcheck source=infra/scripts/lib/preflight.sh
source "${ROOT}/infra/scripts/lib/preflight.sh"

require_docker

compose() {
  docker compose --project-directory "$ROOT" -f "$COMPOSE_FILE" "$@"
}

clean_js_deps() {
  log_info "Removing host JavaScript dependencies and Next.js dev caches..."
  rm -rf node_modules
  rm -rf apps/frontend-main/node_modules apps/frontend-admin/node_modules packages/shared/node_modules
  rm -rf apps/frontend-main/.next apps/frontend-admin/.next
}

log_info "Installing JavaScript dependencies inside the Linux dev container..."
log_info "Compose file: ${COMPOSE_FILE}"

if compose ps -q frontend-main frontend-admin 2>/dev/null | grep -q .; then
  log_info "Stopping frontend containers to avoid bind-mount file locks..."
  compose stop frontend-main frontend-admin
fi

clean_js_deps

log_info "Running pnpm install in frontend-main container..."
compose run --rm --no-deps frontend-main pnpm install

if compgen -G "node_modules/.pnpm/lightningcss-linux-arm64-gnu@*/node_modules/lightningcss-linux-arm64-gnu/lightningcss.linux-arm64-gnu.node" >/dev/null 2>&1; then
  log_success "Linux lightningcss binary present."
elif compgen -G "node_modules/.pnpm/lightningcss-linux-x64-gnu@*/node_modules/lightningcss-linux-x64-gnu/lightningcss.linux-x64-gnu.node" >/dev/null 2>&1; then
  log_success "Linux lightningcss binary present."
else
  log_warning "Could not verify lightningcss Linux binary under node_modules/.pnpm (may still be OK on this platform)."
fi

log_success "JavaScript dependencies installed for Docker."
echo ""
echo "Next steps:"
echo "  make dev-up        # start stack (or make dev-restart if already up)"
echo "  make dev-logs      # confirm no lightningcss errors"
echo ""
echo "If you use debug Compose: make debug-install-js"
echo "For host editor tooling / pnpm check on macOS: make editor-happy (re-run make dev-install-js before Docker dev)"
