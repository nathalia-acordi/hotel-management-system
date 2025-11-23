import { Reservation } from '../domain/Reservation.js';

export class ReservationService {
  constructor(reservationRepository) {
    this.reservationRepository = reservationRepository;
    
  }

  async createReservation({ userId, guestId, roomId, checkIn, checkOut }) {
    
    if (userId == null || roomId == null || !checkIn || !checkOut) {
      throw new Error('userId, roomId, checkIn e checkOut são obrigatórios.');
    }
    
    const validUserId = (typeof userId === 'number' && userId > 0) || (typeof userId === 'string' && userId.trim() !== '');
    const validRoomId = (typeof roomId === 'number' && roomId > 0) || (typeof roomId === 'string' && roomId.trim() !== '');
    if (!validUserId || !validRoomId) {
      throw new Error('userId e roomId devem ser números positivos ou identificadores válidos (string).');
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new Error('Datas inválidas.');
    }
    if (checkInDate >= checkOutDate) {
      throw new Error('checkIn deve ser anterior ao checkOut.');
    }
    
    const finalGuestId = guestId || userId;
    
    
    let all = this.reservationRepository.findAll();
    if (all && typeof all.then === 'function') {
      all = await all;
    }
    
    
    if (!Array.isArray(all)) {
      try {
        if (all && typeof all.toArray === 'function') {
          all = await all.toArray();
        } else if (all && typeof all.toJSON === 'function') {
          const json = all.toJSON();
          if (Array.isArray(json)) all = json;
          else all = [];
        } else {
          console.warn('[ReservationService] Warning: findAll did not return an array; coercing to []');
          all = [];
        }
      } catch (e) {
        console.error('[ReservationService] Error coercing findAll result to array:', e && e.stack ? e.stack : e);
        all = [];
      }
    }
    
    try {
      console.log('[ReservationService] findAll result type:', typeof all, 'isArray:', Array.isArray(all), 'constructor:', all && all.constructor && all.constructor.name);
    } catch (e) {
      console.warn('[ReservationService] Could not log findAll result type:', e && e.message);
    }

    if (all && typeof all.some !== 'function') {
      try {
        if (all && typeof all[Symbol.iterator] === 'function') {
          all = Array.from(all);
          console.log('[ReservationService] Coerced iterable findAll result to array, length=', all.length);
        } else {
          console.warn('[ReservationService] findAll returned non-iterable, coercing to []');
          all = [];
        }
      } catch (e) {
        console.error('[ReservationService] Error while coercing findAll to array:', e && e.stack ? e.stack : e);
        all = [];
      }
    }

    
    const overlapping = (all || []).some(r =>
      String(r.roomId) === String(roomId) &&
      new Date(r.checkIn) < checkOutDate && checkInDate < new Date(r.checkOut)
    );
    if (overlapping) {
      throw new Error('Quarto já reservado para o período informado.');
    }
    const reservation = new Reservation({
      id: undefined, 
      userId,
      guestId: finalGuestId,
      roomId,
      checkIn,
      checkOut
    });
    const saveResult = this.reservationRepository.save(reservation);
    if (saveResult && typeof saveResult.then === 'function') {
      const saved = await saveResult;
      
      return saved || reservation;
    }
    
    return reservation;
  }

  getAllReservations() {
    const all = this.reservationRepository.findAll();
    if (all && typeof all.then === 'function') return all;
    return Promise.resolve(all);
  }

  async checkIn(id) {
    let reservation = this.reservationRepository.findById(id);
    if (reservation && typeof reservation.then === 'function') reservation = await reservation;
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (reservation.checkInStatus) throw new Error('Check-in já realizado.');
    reservation.checkInStatus = true;
    const up = this.reservationRepository.update(reservation);
    if (up && typeof up.then === 'function') await up;
    return reservation;
  }

  async checkOut(id) {
    let reservation = this.reservationRepository.findById(id);
    if (reservation && typeof reservation.then === 'function') reservation = await reservation;
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (!reservation.checkInStatus) throw new Error('Check-in não realizado.');
    if (reservation.checkOutStatus) throw new Error('Check-out já realizado.');
    reservation.checkOutStatus = true;
    const up = this.reservationRepository.update(reservation);
    if (up && typeof up.then === 'function') await up;
    return reservation;
  }

  async cancelReservation(id) {
    let reservation = this.reservationRepository.findById(id);
    if (reservation && typeof reservation.then === 'function') reservation = await reservation;
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (reservation.checkOutStatus) throw new Error('Reserva já finalizada.');
    if (reservation.cancelled) throw new Error('Reserva já cancelada.');
    reservation.cancelled = true;
    const up = this.reservationRepository.update(reservation);
    if (up && typeof up.then === 'function') await up;
    return reservation;
  }

  async updatePaymentStatus(id, paymentStatus) {
    let reservation = this.reservationRepository.findById(id);
    if (reservation && typeof reservation.then === 'function') reservation = await reservation;
    if (!reservation) throw new Error('Reserva não encontrada');
    reservation.paymentStatus = paymentStatus;
    const up = this.reservationRepository.update(reservation);
    if (up && typeof up.then === 'function') await up;
    return reservation;
  }
}
