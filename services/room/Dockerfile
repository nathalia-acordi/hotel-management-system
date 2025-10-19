ARG BASE_IMAGE=node:20-alpine
FROM ${BASE_IMAGE}
WORKDIR /app
COPY package*.json ./
ARG INCLUDE_DEV=false
RUN if [ "$INCLUDE_DEV" = "true" ]; then npm ci; else npm ci --omit=dev; fi
COPY . .
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["/bin/sh", "-c", "./docker-entrypoint.sh \"$@\"", "--"]
CMD ["node", "src/index.mjs"]