import mongoose from 'mongoose';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { HttpError } from '../application/HttpError.js';

const paymentSchema = new mongoose.Schema({
  reservationId: { type: Number, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, required: true, enum: ['cartao', 'pix', 'dinheiro'] },
  status: { type: String, enum: ['pendente', 'pago', 'cancelado'], default: 'pendente' },
  finalAmount: { type: Number }, // Valor após aplicar desconto
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Índice composto para evitar pagamentos duplicados para mesma reserva/método
paymentSchema.index({ reservationId: 1, method: 1 }, { unique: true });

const PaymentModel = mongoose.model('Payment', paymentSchema);

export class MongoPaymentRepository extends PaymentRepository {
  async add(payment) {
    console.log('[PaymentRepository] Tentando criar pagamento:', { 
      reservationId: payment.reservationId, 
      method: payment.method 
    });
    try {
      const newPayment = new PaymentModel(payment);
      const savedPayment = await newPayment.save();
      console.log('[PaymentRepository] Pagamento criado com sucesso:', { 
        id: savedPayment._id, 
        reservationId: savedPayment.reservationId 
      });
      return { ...savedPayment.toObject(), id: savedPayment._id };
    } catch (error) {
      console.error('[PaymentRepository] Erro ao criar pagamento:', error.message);
      if (error.code === 11000) {
        throw new HttpError(409, 'Pagamento já existe para esta reserva e método');
      }
      if (error.name === 'ValidationError') {
        throw new HttpError(400, 'Dados de pagamento inválidos');
      }
      throw new HttpError(500, 'Erro interno do servidor');
    }
  }

  async findByReservationAndMethod(reservationId, method) {
    console.log('[PaymentRepository] Buscando pagamento:', { reservationId, method });
    try {
      const payment = await PaymentModel.findOne({ reservationId, method });
      return payment ? { ...payment.toObject(), id: payment._id } : null;
    } catch (error) {
      console.error('[PaymentRepository] Erro ao buscar pagamento:', error.message);
      throw new HttpError(500, 'Erro interno do servidor');
    }
  }

  async getAll() {
    console.log('[PaymentRepository] Listando todos os pagamentos');
    try {
      const payments = await PaymentModel.find();
      return payments.map(p => ({ ...p.toObject(), id: p._id }));
    } catch (error) {
      console.error('[PaymentRepository] Erro ao listar pagamentos:', error.message);
      throw new HttpError(500, 'Erro interno do servidor');
    }
  }
}