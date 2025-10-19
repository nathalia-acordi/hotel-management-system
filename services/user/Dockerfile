FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
ARG INCLUDE_DEV=false
RUN if [ "$INCLUDE_DEV" = "true" ]; then npm ci; else npm ci --omit=dev; fi
COPY . .
EXPOSE 3000
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["/bin/sh", "-c", "./docker-entrypoint.sh \"$@\"", "--"]
CMD ["node", "src/interfaces/server.js"]