console.log('Iniciando User Service...');
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

import express from 'express';
import bodyParser from 'body-parser';
import { validate, register } from './userController.js';

const app = express();
app.use(bodyParser.json());


app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'user' }));
app.post('/register', register);
app.post('/validate', validate);
app.get('/', (req, res) => res.send('User Service running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`User Service listening on port ${PORT}`);
  console.log('Servidor está rodando...');
  console.log('Fim do arquivo server.js');
  setInterval(() => {}, 1000); // Mantém o event loop ativo para depuração
});
