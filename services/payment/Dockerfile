FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY src/swagger.yaml ./src/swagger.yaml

# Sempre inicia o serviço pelo index.mjs
CMD ["node", "src/index.mjs"]