import express from 'express';
import { createPaymentController } from './paymentController.js';
import amqp from 'amqplib';

export function createApp(paymentService) {
  const app = express();
  app.use(express.json());
  const controller = createPaymentController(paymentService);

  // Health check mais robusto
  app.get('/health', async (req, res) => {
    try {
      // Verifica conexão com RabbitMQ
      const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
      await conn.close();
      
      res.status(200).json({ 
        status: 'ok', 
        service: 'payment',
        uptime: process.uptime(),
        dependencies: {
          rabbitmq: 'connected'
        }
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'error',
        erro: 'Serviço parcialmente indisponível',
        dependencies: {
          rabbitmq: 'disconnected'
        }
      });
    }
  });

  app.get('/payments', controller.listPayments);
  app.post('/payments', controller.createPayment);
  app.get('/payments/:id/status', controller.getPaymentStatus);

  return app;
}
