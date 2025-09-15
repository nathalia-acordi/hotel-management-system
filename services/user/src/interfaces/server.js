import express from 'express';
import bodyParser from 'body-parser';
console.log('Iniciando User Service...');
process.on('uncaughtException', (err) => {
  console.error('[USER] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[USER] Unhandled Rejection:', reason);
});
import { register, validate } from './userController.js';
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});


export function createApp({ registerMiddleware = register, validateMiddleware = validate } = {}) {
  const app = express();
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    console.log(`[USER] Requisição recebida: ${req.method} ${req.url}`);
    next();
  });
  app.on('connection', (socket) => {
    console.log('[USER] Nova conexão TCP recebida:', socket.remoteAddress, socket.remotePort);
  });
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'user' }));
  app.post('/register', registerMiddleware);
  app.post('/validate', validateMiddleware);
  app.get('/', (req, res) => res.send('User Service running'));

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`User Service listening on port ${PORT}`);
    console.log('Servidor está rodando...');
    console.log('Fim do arquivo server.js');
    setInterval(() => {}, 1000); // Mantém o event loop ativo para depuração
  });
}
