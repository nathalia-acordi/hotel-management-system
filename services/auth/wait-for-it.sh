#!/usr/bin/env sh
# wait-for-it.sh: Wait until a host and port are available
# Usage: wait-for-it.sh host:port -- command args

set -e

host_port="$1"
shift

host=$(echo "$host_port" | cut -d: -f1)
port=$(echo "$host_port" | cut -d: -f2)

for i in $(seq 1 30); do
  nc -z "$host" "$port" && break
  echo "Waiting for $host:$port... ($i)"
  sleep 1
done

if ! nc -z "$host" "$port"; then
  echo "Timeout waiting for $host:$port"
  exit 1
fi

exec "$@"
