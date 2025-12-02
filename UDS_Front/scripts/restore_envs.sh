#!/usr/bin/env bash
set -euo pipefail

SNAP_BASE="/home/uds"
SNAP_DIR="${1:-${SNAP_BASE}/latest_page}"

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



log "✅ Restauración finalizada desde snapshot: ${SNAP_DIR}"
