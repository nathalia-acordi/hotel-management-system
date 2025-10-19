#!/bin/sh
set -e

# Permitir fallback a USER_MONGODB_URI quando MONGODB_URI não estiver definida
if [ -z "$MONGODB_URI" ] && [ -n "$USER_MONGODB_URI" ]; then
  export MONGODB_URI="$USER_MONGODB_URI"
fi

if [ -z "$MONGODB_URI" ]; then
  echo "[USER] ERRO: MONGODB_URI não definida. Configure .env.local (USER_MONGODB_URI)." >&2
  exit 1
fi

exec "$@"
