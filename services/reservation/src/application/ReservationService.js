import { Reservation } from '../domain/Reservation.js';

export class ReservationService {
  constructor(reservationRepository) {
    this.reservationRepository = reservationRepository;
    this.nextId = 1;
  }

  createReservation({ userId, roomId, checkIn, checkOut }) {
    if (!userId || !roomId || !checkIn || !checkOut) {
      throw new Error('userId, roomId, checkIn e checkOut são obrigatórios.');
    }
    const reservation = new Reservation({
      id: this.nextId++,
      userId,
      roomId,
      checkIn,
      checkOut
    });
    this.reservationRepository.save(reservation);
    return reservation;
  }

  getAllReservations() {
    return this.reservationRepository.findAll();
  }
}
