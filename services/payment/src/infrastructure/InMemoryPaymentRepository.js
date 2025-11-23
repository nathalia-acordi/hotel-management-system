

import { PaymentRepository } from '../domain/PaymentRepository.js';

export class InMemoryPaymentRepository extends PaymentRepository {
  constructor() {
    super();
    this.payments = [];
    this.nextPaymentId = 1;
  }

  add(payment) {
    payment.id = this.nextPaymentId++;
    this.payments.push(payment);
    return payment;
  }

  findByReservationAndMethod(reservationId, method) {
    return this.payments.find(p => p.reservationId === reservationId && p.method === method);
  }

  getAll() {
    return this.payments;
  }
}
