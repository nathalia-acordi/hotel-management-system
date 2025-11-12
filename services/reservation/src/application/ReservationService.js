import { Reservation } from '../domain/Reservation.js';

export class ReservationService {
  constructor(reservationRepository) {
    this.reservationRepository = reservationRepository;
    //this.nextId = 1;
  }

  createReservation({ userId, guestId, roomId, checkIn, checkOut }) {
    // Validação de campos obrigatórios
    if (userId == null || roomId == null || !checkIn || !checkOut) {
      throw new Error('userId, roomId, checkIn e checkOut são obrigatórios.');
    }
    // Validação de IDs positivos
    if (typeof userId !== 'number' || userId <= 0 || typeof roomId !== 'number' || roomId <= 0) {
      throw new Error('userId e roomId devem ser números positivos.');
    }
    // Validação de datas
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new Error('Datas inválidas.');
    }
    if (checkInDate >= checkOutDate) {
      throw new Error('checkIn deve ser anterior ao checkOut.');
    }
    // guestId pode ser omitido (caso o usuário seja o próprio hóspede)
    const finalGuestId = guestId || userId;
    // Verifica disponibilidade do quarto
    const all = this.reservationRepository.findAll();
    const overlapping = all.some(r =>
      r.roomId === roomId &&
      new Date(r.checkIn) < checkOutDate && checkInDate < new Date(r.checkOut)
    );
    if (overlapping) {
      throw new Error('Quarto já reservado para o período informado.');
    }
    const reservation = new Reservation({
      id: undefined, // MongoDB gerará o id
      userId,
      guestId: finalGuestId,
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

  checkIn(id) {
    const reservation = this.reservationRepository.findById(id);
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (reservation.checkInStatus) throw new Error('Check-in já realizado.');
    reservation.checkInStatus = true;
    this.reservationRepository.update(reservation);
    return reservation;
  }

  checkOut(id) {
    const reservation = this.reservationRepository.findById(id);
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (!reservation.checkInStatus) throw new Error('Check-in não realizado.');
    if (reservation.checkOutStatus) throw new Error('Check-out já realizado.');
    reservation.checkOutStatus = true;
    this.reservationRepository.update(reservation);
    return reservation;
  }

  cancelReservation(id) {
    const reservation = this.reservationRepository.findById(id);
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (reservation.checkOutStatus) throw new Error('Reserva já finalizada.');
    if (reservation.cancelled) throw new Error('Reserva já cancelada.');
    reservation.cancelled = true;
    this.reservationRepository.update(reservation);
    return reservation;
  }

  updatePaymentStatus(id, paymentStatus) {
    const reservation = this.reservationRepository.findById(id);
    if (!reservation) throw new Error('Reserva não encontrada.');
    reservation.paymentStatus = paymentStatus;
    this.reservationRepository.update(reservation);
    return reservation;
  }
}
