export class ReservationRepository {
  constructor() {
    this.reservations = [];
  }

  save(reservation) {
    this.reservations.push(reservation);
  }

  findAll() {
    return this.reservations;
  }
}
