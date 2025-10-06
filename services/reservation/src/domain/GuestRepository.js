// GuestRepository.js
// Interface abstrata para repositório de hóspedes (ISP, DIP)
export class GuestRepository {
  save(guest) {
    throw new Error('Método não implementado');
  }
  findById(id) {
    throw new Error('Método não implementado');
  }
  findAll() {
    throw new Error('Método não implementado');
  }
  findByDocument(document) {
    throw new Error('Método não implementado');
  }
}
