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

  it('não permite reservar o mesmo quarto em datas sobrepostas', () => {
    reservationService.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-16' });
    // Sobreposição total
    expect(() => reservationService.createReservation({ userId: 2, roomId: 2, checkIn: '2025-09-15', checkOut: '2025-09-17' })).toThrow('Quarto já reservado');
    // Sobreposição parcial (início)
    expect(() => reservationService.createReservation({ userId: 3, roomId: 2, checkIn: '2025-09-13', checkOut: '2025-09-15' })).toThrow('Quarto já reservado');
    // Sobreposição parcial (fim)
    expect(() => reservationService.createReservation({ userId: 4, roomId: 2, checkIn: '2025-09-16', checkOut: '2025-09-18' })).not.toThrow();
    // Outro quarto pode ser reservado normalmente
    expect(() => reservationService.createReservation({ userId: 5, roomId: 3, checkIn: '2025-09-14', checkOut: '2025-09-16' })).not.toThrow();
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

  it('não permite reserva com checkIn depois do checkOut', () => {
    const data = { userId: 1, roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-15' };
    expect(() => reservationService.createReservation(data)).toThrow();
  });

  it('não permite reserva com datas inválidas', () => {
    const data = { userId: 1, roomId: 2, checkIn: 'data-invalida', checkOut: '2025-09-15' };
    expect(() => reservationService.createReservation(data)).toThrow();
  });

  it('não permite reserva com userId ou roomId inválido', () => {
    expect(() => reservationService.createReservation({ userId: null, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-15' })).toThrow();
    expect(() => reservationService.createReservation({ userId: 1, roomId: undefined, checkIn: '2025-09-14', checkOut: '2025-09-15' })).toThrow();
    expect(() => reservationService.createReservation({ userId: -1, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-15' })).toThrow();
    expect(() => reservationService.createReservation({ userId: 1, roomId: 0, checkIn: '2025-09-14', checkOut: '2025-09-15' })).toThrow();
  });

  it('permite o mesmo usuário reservar quartos diferentes nas mesmas datas', () => {
    reservationService.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-15' });
    expect(() => reservationService.createReservation({ userId: 1, roomId: 3, checkIn: '2025-09-14', checkOut: '2025-09-15' })).not.toThrow();
  });

  it('simula concorrência: duas reservas simultâneas para o mesmo quarto', async () => {
    const data1 = { userId: 1, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-16' };
    const data2 = { userId: 2, roomId: 2, checkIn: '2025-09-15', checkOut: '2025-09-17' };
    // Simula concorrência: ambas tentam reservar ao mesmo tempo
    const p1 = Promise.resolve().then(() => reservationService.createReservation(data1));
    const p2 = Promise.resolve().then(() => reservationService.createReservation(data2));
    const results = await Promise.allSettled([p1, p2]);
    expect(results.filter(r => r.status === 'fulfilled').length).toBe(1);
    expect(results.filter(r => r.status === 'rejected').length).toBe(1);
    expect(results.find(r => r.status === 'rejected').reason.message).toMatch(/Quarto já reservado/);
  });

  it('lança erro se o repositório lançar exceção ao salvar', () => {
    repo.save = () => { throw new Error('Falha no repo'); };
    expect(() => reservationService.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-15' }))
      .toThrow('Falha no repo');
  });

  it('cria reserva com guestId diferente de userId', () => {
    const data = { userId: 1, guestId: 99, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-15' };
    const reservation = reservationService.createReservation(data);
    expect(reservation.userId).toBe(1);
    expect(reservation.guestId).toBe(99);
  });

  it('retorna lista vazia se não houver reservas', () => {
    const all = reservationService.getAllReservations();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(0);
  });

  it('não permite reserva com tipos errados', () => {
    expect(() => reservationService.createReservation({ userId: 'um', roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-15' })).toThrow();
    expect(() => reservationService.createReservation({ userId: 1, roomId: 'dois', checkIn: '2025-09-14', checkOut: '2025-09-15' })).toThrow();
  });

  it('não permite reserva com checkIn igual ao checkOut', () => {
    expect(() => reservationService.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-14', checkOut: '2025-09-14' })).toThrow();
  });
});
