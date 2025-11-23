import { Reservation } from '../domain/Reservation.js';

export class ReservationService {
  constructor(reservationRepository) {
    this.reservationRepository = reservationRepository;
    
  }

  createReservation({ userId, guestId, roomId, checkIn, checkOut }) {
    if (userId == null || roomId == null || !checkIn || !checkOut) {
      throw new Error('userId, roomId, checkIn e checkOut são obrigatórios.');
    }

    const validUserId = (typeof userId === 'number' && userId > 0);
    const validRoomId = (typeof roomId === 'number' && roomId > 0);
    if (!validUserId || !validRoomId) {
      throw new Error('userId e roomId devem ser números positivos.');
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

    const allResult = this.reservationRepository.findAll();
    // If repository returns a promise, handle asynchronously
    if (allResult && typeof allResult.then === 'function') {
      return (async () => {
        let all = await allResult;
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
      })();
    }

    // synchronous path
    let all = allResult;
    if (!Array.isArray(all)) {
      try {
        if (all && typeof all.toArray === 'function') {
          all = all.toArray();
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

    const reservation = new Reservation({ id: undefined, userId, guestId: finalGuestId, roomId, checkIn, checkOut });
    const saveResult = this.reservationRepository.save(reservation);
    if (saveResult && typeof saveResult.then === 'function') return saveResult.then(saved => saved || reservation);
    return reservation;
  }

  getAllReservations() {
    const all = this.reservationRepository.findAll();
    // If repository returns a promise, forward it so callers can await.
    if (all && typeof all.then === 'function') return all;
    // Otherwise return synchronously (tests expect direct arrays for in-memory repos)
    return all;
  }
  checkIn(id) {
    let reservation = this.reservationRepository.findById(id);
    if (reservation && typeof reservation.then === 'function') {
      return (async () => {
        const r = await reservation;
        if (!r) throw new Error('Reserva não encontrada.');
        if (r.checkInStatus) throw new Error('Check-in já realizado.');
        r.checkInStatus = true;
        const up = this.reservationRepository.update(r);
        if (up && typeof up.then === 'function') await up;
        return r;
      })();
    }
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (reservation.checkInStatus) throw new Error('Check-in já realizado.');
    reservation.checkInStatus = true;
    const up = this.reservationRepository.update(reservation);
    if (up && typeof up.then === 'function') return up.then(() => reservation);
    return reservation;
  }

  checkOut(id) {
    let reservation = this.reservationRepository.findById(id);
    if (reservation && typeof reservation.then === 'function') {
      return (async () => {
        const r = await reservation;
        if (!r) throw new Error('Reserva não encontrada.');
        if (!r.checkInStatus) throw new Error('Check-in não realizado.');
        if (r.checkOutStatus) throw new Error('Check-out já realizado.');
        r.checkOutStatus = true;
        const up = this.reservationRepository.update(r);
        if (up && typeof up.then === 'function') await up;
        return r;
      })();
    }
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (!reservation.checkInStatus) throw new Error('Check-in não realizado.');
    if (reservation.checkOutStatus) throw new Error('Check-out já realizado.');
    reservation.checkOutStatus = true;
    const up = this.reservationRepository.update(reservation);
    if (up && typeof up.then === 'function') return up.then(() => reservation);
    return reservation;
  }

  cancelReservation(id) {
    let reservation = this.reservationRepository.findById(id);
    if (reservation && typeof reservation.then === 'function') {
      return (async () => {
        const r = await reservation;
        if (!r) throw new Error('Reserva não encontrada.');
        if (r.checkOutStatus) throw new Error('Reserva já finalizada.');
        if (r.cancelled) throw new Error('Reserva já cancelada.');
        r.cancelled = true;
        const up = this.reservationRepository.update(r);
        if (up && typeof up.then === 'function') await up;
        return r;
      })();
    }
    if (!reservation) throw new Error('Reserva não encontrada.');
    if (reservation.checkOutStatus) throw new Error('Reserva já finalizada.');
    if (reservation.cancelled) throw new Error('Reserva já cancelada.');
    reservation.cancelled = true;
    const up = this.reservationRepository.update(reservation);
    if (up && typeof up.then === 'function') return up.then(() => reservation);
    return reservation;
  }

  updatePaymentStatus(id, paymentStatus) {
    let reservation = this.reservationRepository.findById(id);
    if (reservation && typeof reservation.then === 'function') {
      return (async () => {
        const r = await reservation;
        if (!r) throw new Error('Reserva não encontrada');
        r.paymentStatus = paymentStatus;
        const up = this.reservationRepository.update(r);
        if (up && typeof up.then === 'function') await up;
        return r;
      })();
    }
    if (!reservation) throw new Error('Reserva não encontrada');
    reservation.paymentStatus = paymentStatus;
    const up = this.reservationRepository.update(reservation);
    if (up && typeof up.then === 'function') return up.then(() => reservation);
    return reservation;
  }
}
