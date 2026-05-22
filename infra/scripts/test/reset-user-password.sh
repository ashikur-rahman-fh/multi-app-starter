#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
# shellcheck source=infra/scripts/lib/run-backend-manage.sh
source "${ROOT}/infra/scripts/lib/run-backend-manage.sh"
run_backend_manage test issue_temporary_password "$@"
