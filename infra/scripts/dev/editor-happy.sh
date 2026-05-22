#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

VENV_DIR="apps/backend/.venv"
VENV_PYTHON="${VENV_DIR}/bin/python"

venv_has_pip() {
  [[ -x "${VENV_PYTHON}" ]] && "${VENV_PYTHON}" -m pip --version >/dev/null 2>&1
}

ensure_venv() {
  if venv_has_pip; then
    echo "==> Python virtual environment already exists at ${VENV_DIR}"
    return
  fi

  if [[ -e "${VENV_DIR}" ]]; then
    echo "==> Removing incomplete Python virtual environment at ${VENV_DIR}..."
    rm -rf "${VENV_DIR}"
  fi

  echo "==> Creating Python virtual environment at ${VENV_DIR}..."
  python3 -m venv "${VENV_DIR}"

  if ! venv_has_pip; then
    PY_VERSION="$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
    echo "error: virtual environment was created but pip is not available." >&2
    echo "error: install the matching venv package, e.g. sudo apt install python${PY_VERSION}-venv" >&2
    echo "error: then run: rm -rf ${VENV_DIR} && make editor-happy" >&2
    echo "error: see docs/development.md#fixing-editor-importpackage-errors" >&2
    exit 1
  fi
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: '$1' is required but not found in PATH" >&2
    exit 1
  fi
}

require_cmd node
require_cmd python3

echo "==> Enabling pnpm via Corepack (packageManager: pnpm@9.15.0)..."
if corepack enable >/dev/null 2>&1 && corepack prepare pnpm@9.15.0 --activate >/dev/null 2>&1; then
  echo "==> pnpm available on PATH: $(command -v pnpm)"
else
  echo "warning: corepack could not install global pnpm (often needs sudo for /usr/bin)." >&2
  echo "warning: installs and quality checks use npx pnpm@9.15.0; or run: sudo corepack enable && corepack prepare pnpm@9.15.0 --activate" >&2
fi

clean_js_deps() {
  echo "==> Removing corrupted JavaScript dependencies..."
  rm -rf node_modules
  rm -rf apps/frontend-main/node_modules apps/frontend-admin/node_modules packages/shared/node_modules
}

install_js_deps() {
  npx pnpm@9.15.0 install "$@"
}

echo "==> Installing JavaScript dependencies (pnpm workspaces)..."
if ! install_js_deps; then
  echo "warning: pnpm install failed (often a corrupted node_modules/.pnpm tree)" >&2
  clean_js_deps
  echo "==> Retrying clean pnpm install..."
  install_js_deps
fi

ensure_venv

echo "==> Installing Python dev dependencies..."
"${VENV_PYTHON}" -m pip install -r apps/backend/requirements-dev.txt

if [[ ! -e .venv ]]; then
  echo "==> Linking .venv -> apps/backend/.venv (Cursor discovers interpreters at repo root)..."
  ln -sfn apps/backend/.venv .venv
elif [[ -L .venv ]] && [[ "$(readlink .venv)" != "apps/backend/.venv" ]]; then
  echo "warning: .venv exists but does not point at apps/backend/.venv; remove it and re-run if Cursor cannot find Django" >&2
fi

echo ""
echo "Editor setup complete."
echo ""
echo "Next steps:"
echo "  1. Open this repo at the root in VS Code/Cursor (not a subfolder)."
echo "  2. Run: Developer: Reload Window"
echo "  3. Confirm Python interpreter: ${VENV_DIR}/bin/python"
echo "  4. Optional: TypeScript: Select TypeScript Version -> Use Workspace Version"
echo ""
echo "If imports still show errors, see docs/development.md#fixing-editor-importpackage-errors"
