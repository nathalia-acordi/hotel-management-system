// index.js - Entry point do Reservation Service
// - Aplica Clean Architecture: separa camadas de interface, domínio e infraestrutura
// - Permite injeção de middlewares para facilitar testes (mock de autenticação, etc)
// - Integração com RabbitMQ para eventos de usuário criado

import express from 'express';
import reservationController from './interfaces/reservationController.js';
import { InMemoryReservationRepository } from './infrastructure/InMemoryReservationRepository.js';
import { startUserCreatedConsumer } from './rabbitmqConsumer.js';

// Função factory para criar o app com middlewares injetáveis
export function createApp(middlewares = {}) {
  const app = express();
  app.use(express.json());
  // Health check
  app.get('/', (req, res) => {
    res.send('Reservation Service running');
  });
  app.get('/health', async (req, res) => {
    // Opcional: status do RabbitMQ
    let rabbitStatus = 'unknown';
    if (global.__rabbitmqConnected === true) rabbitStatus = 'connected';
    if (global.__rabbitmqConnected === false) rabbitStatus = 'disconnected';
    res.status(200).json({
      status: 'ok',
      service: 'reservation',
      uptime: process.uptime(),
      rabbitmq: rabbitStatus
    });
  });
  // Injeção de dependência do repositório (DIP)
  const reservationRepository = new InMemoryReservationRepository();
  global.__reservationRepository__ = reservationRepository;
  app.use('/', reservationController(middlewares));
  return app;
}

// Inicialização padrão (exceto em testes)
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Reservation Service running on port ${PORT}`);
    // Inicia consumer RabbitMQ para eventos de usuário criado
    startUserCreatedConsumer();
  });
}