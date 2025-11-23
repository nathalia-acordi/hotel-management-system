FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY src/swagger.yaml ./src/swagger.yaml

# Permite rodar testes facilmente
ARG TEST=false
CMD if [ "$TEST" = "true" ]; then npm test; else npm run start; fi