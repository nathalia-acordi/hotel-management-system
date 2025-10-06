import { createApp } from './interfaces/server.js';
import { PaymentService } from './application/PaymentService.js';
import { InMemoryPaymentRepository } from './infrastructure/InMemoryPaymentRepository.js';

const paymentRepository = new InMemoryPaymentRepository();
const paymentService = new PaymentService(paymentRepository);
const app = createApp(paymentService);

export default app;

