FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Ponto de entrada padrão para produção
CMD ["node", "src/interfaces/server.js"]

# Permite rodar testes facilmente
ARG TEST=false
CMD if [ "$TEST" = "true" ]; then npm test; else node src/interfaces/server.js; fi