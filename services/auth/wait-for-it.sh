#!/usr/bin/env sh
# wait-for-it.sh: Aguarda até que um host e porta estejam disponíveis antes de executar um comando
# Uso: wait-for-it.sh host:porta -- comando args
#
# Exemplo prático: Em ambientes Docker Compose, garante que um serviço dependente (ex: banco, API) esteja pronto antes de subir o próximo container.
#
# Por que é necessário? Em sistemas distribuídos, um serviço pode tentar se conectar a outro que ainda está inicializando. Esse script evita erros de "connection refused" ao sincronizar a inicialização.

set -e  # Encerra o script se qualquer comando falhar

# Pega o argumento host:porta
host_port="$1"
shift  # Remove o primeiro argumento, o restante será o comando a executar

# Extrai host e porta
host=$(echo "$host_port" | cut -d: -f1)
port=$(echo "$host_port" | cut -d: -f2)

# Tenta conectar até 30 vezes (timeout ~30s)
for i in $(seq 1 30); do
  # nc -z testa se a porta está aberta
  nc -z "$host" "$port" && break
  echo "Waiting for $host:$port... ($i)"
  sleep 1
done

# Se não conseguiu conectar após 30 tentativas, falha
if ! nc -z "$host" "$port"; then
  echo "Timeout waiting for $host:$port"
  exit 1
fi

# Se chegou aqui, o serviço está disponível. Executa o comando passado após --
exec "$@"
