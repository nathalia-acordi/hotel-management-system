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

exec "$@"
