FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
ARG INCLUDE_DEV=false
RUN if [ "$INCLUDE_DEV" = "true" ]; then npm ci; else npm ci --omit=dev; fi
COPY . .
CMD ["node", "src/interfaces/server.js"]