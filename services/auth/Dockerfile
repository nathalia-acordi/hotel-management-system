FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "src/interfaces/server.js"]

# Permite rodar testes facilmente
ARG TEST=false
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
CMD if [ "$TEST" = "true" ]; then /wait-for-it.sh user:3000 -- npm test; else node src/interfaces/server.js; fi