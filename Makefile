.PHONY: dev-up dev-down dev-build dev-logs dev-restart \
	debug-up debug-down debug-build debug-logs debug-restart \
	backend-shell backend-migrate backend-makemigrations backend-createsuperuser \
	editor-happy build check test test-all test-backend test-frontend-main test-frontend-admin test-shared test-integration \
	prod-up prod-down prod-build prod-logs prod-restart prod-migrate prod-collectstatic prod-nginx-config \
	prod-deploy prod-rollback \
	db-backup db-restore db-reset

# Docker Compose files: infra/docker/compose/*.yml (invoked via infra/scripts with --project-directory).
dev-up:
	bash infra/scripts/dev/up.sh

dev-down:
	bash infra/scripts/dev/down.sh

dev-build:
	bash infra/scripts/dev/build.sh

dev-logs:
	bash infra/scripts/dev/logs.sh

dev-restart:
	bash infra/scripts/dev/restart.sh

debug-up:
	bash infra/scripts/debug/up.sh

debug-down:
	bash infra/scripts/debug/down.sh

debug-build:
	bash infra/scripts/debug/build.sh

debug-logs:
	bash infra/scripts/debug/logs.sh

debug-restart:
	bash infra/scripts/debug/restart.sh

backend-shell:
	bash infra/scripts/dev/shell.sh

backend-migrate:
	bash infra/scripts/dev/migrate.sh

backend-makemigrations:
	bash infra/scripts/dev/makemigrations.sh

backend-createsuperuser:
	bash infra/scripts/dev/createsuperuser.sh

editor-happy:
	bash infra/scripts/dev/editor-happy.sh

build:
	bash infra/scripts/build/build-frontends.sh

check:
	pnpm check

test:
	bash infra/scripts/test/test-all.sh

test-all: test

test-backend:
	bash infra/scripts/test/test-backend.sh

test-frontend-main:
	bash infra/scripts/test/test-frontend-main.sh

test-frontend-admin:
	bash infra/scripts/test/test-frontend-admin.sh

test-shared:
	bash infra/scripts/test/test-shared.sh

test-integration:
	bash infra/scripts/test/test-integration.sh

prod-nginx-config:
	bash infra/scripts/nginx/render-prod-config.sh

prod-up:
	bash infra/scripts/prod/up.sh

prod-down:
	bash infra/scripts/prod/down.sh

prod-build:
	bash infra/scripts/prod/build.sh

prod-logs:
	bash infra/scripts/prod/logs.sh

prod-restart:
	bash infra/scripts/prod/restart.sh

prod-migrate:
	bash infra/scripts/prod/migrate.sh

prod-collectstatic:
	bash infra/scripts/prod/collectstatic.sh

prod-deploy:
	@test -n "$(IMAGE_TAG)" || (echo "Usage: make prod-deploy IMAGE_TAG=staging-YYMMDD-N" >&2; exit 1)
	IMAGE_TAG="$(IMAGE_TAG)" bash infra/scripts/deploy/vm-deploy.sh

prod-rollback:
	@test -f .previous_deployment || (echo "No .previous_deployment — run a successful prod-deploy first." >&2; exit 1)
	$(MAKE) prod-deploy IMAGE_TAG=$$(cat .previous_deployment)

db-backup:
	bash infra/scripts/db/backup.sh

db-restore:
	bash infra/scripts/db/restore.sh

db-reset:
	bash infra/scripts/db/reset.sh
