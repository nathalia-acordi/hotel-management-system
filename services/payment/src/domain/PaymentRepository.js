// PaymentRepository.js
// Interface de repositório para pagamentos (ISP, DIP)
export class PaymentRepository {
  add(payment) {
    throw new Error('Método não implementado');
  }
  findByReservationAndMethod(reservationId, method) {
    throw new Error('Método não implementado');
  }
  getAll() {
    throw new Error('Método não implementado');
  }
}
