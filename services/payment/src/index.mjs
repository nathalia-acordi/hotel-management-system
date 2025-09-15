import express from 'express';
import axios from 'axios';
import { PixDiscountStrategy, CardNoDiscountStrategy, CashDiscountStrategy } from './domain/strategy/PaymentStrategy.js';

// index.mjs do Payment Service
// - Expõe endpoints REST para criação e consulta de pagamentos
// - Aplica regras de negócio: validação, desconto, integração com Reservation
// - Usa padrão Strategy para cálculo de desconto

const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';

const app = express();
app.use(express.json());

// Armazena pagamentos em memória (simples para fins didáticos)
const payments = [];
let nextPaymentId = 1;

// Health check
app.get('/', (req, res) => {
  res.send('Payment Service running');
});

// Métodos aceitos
const allowedMethods = ['cartao', 'pix', 'dinheiro'];

// Criação de pagamento
app.post('/payments', async (req, res) => {
  // Validação de campos obrigatórios e tipos
  const { reservationId, amount, method, status } = req.body;
  if (reservationId == null || amount == null || method == null) {
    return res.status(400).json({ error: 'reservationId, amount e method são obrigatórios' });
  }
  // reservationId deve ser inteiro positivo
  if (typeof reservationId !== 'number' || reservationId <= 0 || !Number.isInteger(reservationId)) {
    return res.status(400).json({ error: 'reservationId inválido' });
  }
  // amount deve ser positivo
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount deve ser positivo' });
  }
  if (!allowedMethods.includes(method)) {
    return res.status(400).json({ error: 'Método de pagamento inválido. Use: cartao, pix ou dinheiro.' });
  }
  // Não pode haver pagamento duplicado para mesma reserva e método
  if (payments.some(p => p.reservationId === reservationId && p.method === method)) {
    return res.status(400).json({ error: 'Pagamento já registrado para esta reserva e método.' });
  }
  // Cria objeto de pagamento
  const payment = {
    id: nextPaymentId++,
    reservationId,
    amount,
    method,
    status: status || 'pendente', // pendente, pago, cancelado
    createdAt: new Date().toISOString()
  };
  payments.push(payment);

  // Se status for "pago", aplicar desconto e atualizar reserva
  if ((status || 'pendente') === 'pago') {
    try {
      // Escolhe a estratégia de desconto conforme método
      let strategy;
      switch (method) {
        case 'pix':
          strategy = new PixDiscountStrategy();
          break;
        case 'dinheiro':
          strategy = new CashDiscountStrategy();
          break;
        case 'cartao':
        default:
          strategy = new CardNoDiscountStrategy();
      }
      const finalAmount = strategy.calculate(amount);
      payment.amount = finalAmount;
      await axios.patch(`${RESERVATION_URL}/reservations/${reservationId}/payment`, { paymentStatus: 'pago' });
    } catch (err) {
      // Apenas loga, não impede pagamento
    }
  }

  res.status(201).json(payment);
});

// Listar pagamentos
app.get('/payments', (req, res) => {
  res.json(payments);
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
  });
}

export default app;
