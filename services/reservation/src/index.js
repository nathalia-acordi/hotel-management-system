// Entry point Reservation Service


import express from 'express';
import reservationController from './interfaces/reservationController.js';
import { startUserCreatedConsumer } from './rabbitmqConsumer.js';

export function createApp(middlewares = {}) {
  const app = express();
  app.use(express.json());
  app.get('/', (req, res) => {
    res.send('Reservation Service running');
  });
  app.use('/', reservationController(middlewares));
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Reservation Service running on port ${PORT}`);
    startUserCreatedConsumer();
  });
}