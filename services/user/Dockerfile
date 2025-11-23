FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
ARG INCLUDE_DEV=false
RUN if [ "$INCLUDE_DEV" = "true" ]; then npm ci; else npm ci --omit=dev; fi
COPY . .
COPY src/swagger.yaml ./src/swagger.yaml
EXPOSE 3000
# Normaliza quebras de linha Windows e garante permissão de execução
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
# Usa o entrypoint diretamente (sem sh -c) para evitar problemas de parsing
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/interfaces/server.js"]