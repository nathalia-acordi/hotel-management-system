export class ReservationRepository {
  constructor() {
    this.reservations = [];
  }


  save(reservation) {
    this.reservations.push(reservation);
  }

  findById(id) {
    return this.reservations.find(r => r.id === id);
  }

  update(reservation) {
    const idx = this.reservations.findIndex(r => r.id === reservation.id);
    if (idx !== -1) {
      this.reservations[idx] = reservation;
    }
  }

  findAll() {
    return this.reservations;
  }

  
  clear() {
    this.reservations = [];
  }
}
