

import axios from 'axios';
import amqp from 'amqplib';
import { PixDiscountStrategy, CardNoDiscountStrategy, CashDiscountStrategy } from '../domain/strategy/PaymentStrategy.js';

const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';
const allowedMethods = ['cartao', 'pix', 'dinheiro'];

export class PaymentService {
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
    if (process.env.NODE_ENV !== 'test') {
      this.setupRabbitMQ();
    }
  }

  async setupRabbitMQ() {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
      const channel = await conn.createChannel();
      await channel.assertExchange('payment_events', 'topic', { durable: true });
      this.channel = channel;
    } catch (error) {
      console.error('[PAYMENT] Erro ao conectar com RabbitMQ:', error.message);
    }
  }

  async publishPaymentEvent(payment) {
    try {
      if (this.channel) {
        const event = {
          type: 'payment.completed',
          payload: {
            reservationId: payment.reservationId,
            status: payment.status,
            amount: payment.amount
          },
          timestamp: new Date().toISOString()
        };
        
        await this.channel.publish(
          'payment_events',
          'payment.completed',
          Buffer.from(JSON.stringify(event))
        );
      }
    } catch (error) {
      console.error('[PAYMENT] Erro ao publicar evento:', error.message);
    }
  }

  async createPayment(data) {
    const { reservationId, amount, method, status } = data;
    
    if (reservationId == null || amount == null || method == null) {
      return { status: 400, body: { error: 'reservationId, amount e method são obrigatórios' } };
    }
    
    const isNumericId = typeof reservationId === 'number' && Number.isInteger(reservationId) && reservationId > 0;
    const isStringId = typeof reservationId === 'string' && reservationId.trim() !== '';
    if (!isNumericId && !isStringId) {
      return { status: 400, body: { error: 'reservationId inválido' } };
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return { status: 400, body: { error: 'amount deve ser positivo' } };
    }
    if (!allowedMethods.includes(method)) {
      return { status: 400, body: { error: 'Método de pagamento inválido. Use: cartao, pix ou dinheiro.' } };
    }
    if (await this.paymentRepository.findByReservationAndMethod(reservationId, method)) {
      return { status: 400, body: { error: 'Pagamento já registrado para esta reserva e método.' } };
    }
    
    const payment = {
      reservationId,
      amount,
      method,
      status: status || 'pendente',
      createdAt: new Date().toISOString()
    };
    await this.paymentRepository.add(payment);
    
    if ((status || 'pendente') === 'pago') {
      try {
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
        await this.publishPaymentEvent(payment);
      } catch (err) {
        console.error('[PAYMENT] Erro ao processar pagamento:', err.message);
      }
    }
    return { status: 201, body: payment };
  }

  async listPayments() {
    return this.paymentRepository.getAll();
  }
}
