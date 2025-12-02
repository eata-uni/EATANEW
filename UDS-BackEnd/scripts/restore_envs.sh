#!/usr/bin/env bash
set -euo pipefail

SNAP_BASE="/home/uds"
SNAP_DIR="${1:-${SNAP_BASE}/latest}"

if [[ ! -d "${SNAP_DIR}" ]]; then
  echo "❌ No existe snapshot: ${SNAP_DIR}" >&2
  exit 1
fi

log() { echo "[$(date +%T)] $*"; }

# ====== Restaurar entornos Python ======
for PY_DIR in "${SNAP_DIR}"/python_env_*; do
  [[ -d "${PY_DIR}" ]] || continue

  # Lee metadatos
  source "${PY_DIR}/meta.env"

  REQS="${PY_DIR}/requirements.txt"
  NEW_VENV_DIR="${VENV_DIR}"   # puedes cambiar destino si quieres

  log "🐍 Reconstruyendo venv en ${NEW_VENV_DIR} (proyecto: ${PROJECT_DIR})"
  mkdir -p "$(dirname "${NEW_VENV_DIR}")"

  # Crea venv si no existe
  if [[ ! -d "${NEW_VENV_DIR}" ]]; then
    python3 -m venv "${NEW_VENV_DIR}"
  fi

  # Instala requirements
  "${NEW_VENV_DIR}/bin/python" -m pip install --upgrade pip wheel >/dev/null
  if [[ -f "${REQS}" ]]; then
    "${NEW_VENV_DIR}/bin/python" -m pip install -r "${REQS}"
  else
    log "⚠️  No se encontró requirements.txt en ${PY_DIR}"
  fi
done

# ====== Restaurar proyecto Node ======
NODE_SNAP="${SNAP_DIR}/node_project"
if [[ -d "${NODE_SNAP}" ]]; then
  # Usa el mismo dir del proyecto original (puedes cambiarlo)
  TARGET_NODE_DIR="/home/uds/DB_CON"
  mkdir -p "${TARGET_NODE_DIR}"

  log "🟢 Restaurando Node en ${TARGET_NODE_DIR}"
  # Copia manifestos
  [[ -f "${NODE_SNAP}/package.json" ]] && cp -f "${NODE_SNAP}/package.json" "${TARGET_NODE_DIR}/package.json"
  [[ -f "${NODE_SNAP}/package-lock.json" ]] && cp -f "${NODE_SNAP}/package-lock.json" "${TARGET_NODE_DIR}/package-lock.json"
  [[ -f "${NODE_SNAP}/.nvmrc" ]] && cp -f "${NODE_SNAP}/.nvmrc" "${TARGET_NODE_DIR}/.nvmrc"

  pushd "${TARGET_NODE_DIR}" >/dev/null
  # Si usas nvm: intenta setear versión
  if command -v nvm >/dev/null 2>&1 && [[ -f ".nvmrc" ]]; then
    nvm install "$(cat .nvmrc)" || true
    nvm use "$(cat .nvmrc)" || true
  fi

  # Instala dependencias tal cual lockfile (reproducible)
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  popd >/dev/null
fi

log "✅ Restauración finalizada desde snapshot: ${SNAP_DIR}"
