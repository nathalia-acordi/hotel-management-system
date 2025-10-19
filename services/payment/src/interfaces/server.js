// server.js
// Inicialização do Express e definição das rotas HTTP do Payment Service
import express from 'express';
import { createPaymentController } from './paymentController.js';

export function createApp(paymentService) {
  const app = express();
  app.use(express.json());
  const controller = createPaymentController(paymentService);

  // Health endpoints
  app.get('/', controller.health);
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'payment', uptime: process.uptime() });
  });
  app.get('/payments', controller.listPayments);
  app.post('/payments', controller.createPayment);

  return app;
}

// Inicialização padrão (exceto em testes)
if (process.env.NODE_ENV !== 'test') {
  // Importação dinâmica para evitar dependência circular
  Promise.all([
    import('../application/PaymentService.js'),
    import('../infrastructure/InMemoryPaymentRepository.js')
  ]).then(([{ PaymentService }, { InMemoryPaymentRepository }]) => {
    const paymentRepository = new InMemoryPaymentRepository();
    const paymentService = new PaymentService(paymentRepository);
    const app = createApp(paymentService);
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      console.log(`Payment Service listening on port ${PORT}`);
    });
  });
}
