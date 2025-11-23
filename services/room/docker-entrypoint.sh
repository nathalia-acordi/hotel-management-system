#!/bin/sh
set -e

# Permitir fallback a ROOM_MONGODB_URI quando MONGODB_URI não estiver definida
if [ -z "$MONGODB_URI" ] && [ -n "$ROOM_MONGODB_URI" ]; then
  export MONGODB_URI="$ROOM_MONGODB_URI"
fi

if [ -z "$MONGODB_URI" ]; then
  echo "[ROOM] ERRO: MONGODB_URI não definida. Configure .env.local (ROOM_MONGODB_URI)." >&2
  exit 1
fi

# Debug: mascarar credenciais e exibir host alvo
_mask_uri() {
  # Remove credenciais para log (user:pass@)
  echo "$1" | sed -E 's#(mongodb\+srv://)[^:]+:[^@]+@#\1****:****@#'
}
MASKED_URI=$(_mask_uri "$MONGODB_URI")
echo "[ROOM] Conectando ao Mongo URI: $MASKED_URI" >&2

exec "$@"
