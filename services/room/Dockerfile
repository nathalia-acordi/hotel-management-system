ARG BASE_IMAGE=node:20-alpine
FROM ${BASE_IMAGE}
WORKDIR /app
COPY package*.json ./
ARG INCLUDE_DEV=false
RUN if [ "$INCLUDE_DEV" = "true" ]; then npm ci; else npm ci --omit=dev; fi
COPY src/ ./src/
COPY src/swagger.yaml ./src/swagger.yaml
COPY docker-entrypoint.sh ./docker-entrypoint.sh
# Normaliza quebras de linha Windows e garante permissão de execução
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
# Usa o entrypoint diretamente (sem sh -c) para evitar problemas de parsing
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/index.mjs"]