FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]

# Permite rodar testes facilmente
ARG TEST=false
CMD if [ "$TEST" = "true" ]; then npm test; else npm run start; fi