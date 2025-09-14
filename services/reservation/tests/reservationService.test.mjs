import { ReservationService } from '../src/application/ReservationService.js';

class FakeReservationRepository {
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

describe('ReservationService', () => {
  let reservationService;
  let repo;

  beforeEach(() => {
    repo = new FakeReservationRepository();
    reservationService = new ReservationService(repo);
  });

  it('cria uma reserva válida', () => {
    const data = { userId: 1, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-15' };
    const reservation = reservationService.createReservation(data);
    expect(reservation.userId).toBe(1);
    expect(reservation.roomId).toBe(2);
    expect(reservation.checkIn).toBe('2025-09-14');
    expect(reservation.checkOut).toBe('2025-09-15');
    expect(repo.findAll().length).toBe(1);
  });

  it('lança erro se faltar campos obrigatórios', () => {
    expect(() => reservationService.createReservation({})).toThrow();
  });

  it('retorna todas as reservas', () => {
    reservationService.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-15' });
    reservationService.createReservation({ userId: 2, roomId: 3, checkIn: '2025-09-16', checkOut: '2025-09-17' });
    const all = reservationService.getAllReservations();
    expect(all.length).toBe(2);
  });
});
