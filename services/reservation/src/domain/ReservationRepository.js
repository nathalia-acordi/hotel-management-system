// ReservationRepository.js
// Interface abstrata para repositório de reservas (ISP, DIP)
export class ReservationRepository {
  save(reservation) {
    throw new Error('Método não implementado');
  }
  findById(id) {
    throw new Error('Método não implementado');
  }
  update(reservation) {
    throw new Error('Método não implementado');
  }
  findAll() {
    throw new Error('Método não implementado');
  }
  clear() {
    throw new Error('Método não implementado');
  }
}
