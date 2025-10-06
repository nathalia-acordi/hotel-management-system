import { ReservationService } from '../src/application/ReservationService.js';

describe('ReservationService', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = {
      data: [],
      findAll: function() { return this.data; },
      findById: function(id) { return this.data.find(r => r.id === id); },
      save: function(r) { this.data.push(r); },
      update: function(r) { const i = this.data.findIndex(x => x.id === r.id); if (i >= 0) this.data[i] = r; }
    };
    service = new ReservationService(repo);
  });

  it('deve criar reserva válida', () => {
    const res = service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' });
    expect(res).toHaveProperty('id');
    expect(res.userId).toBe(1);
    expect(res.roomId).toBe(2);
  });

  it('deve lançar erro se faltar campos obrigatórios', () => {
    expect(() => service.createReservation({ roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' })).toThrow();
    expect(() => service.createReservation({ userId: 1, checkIn: '2025-09-20', checkOut: '2025-09-22' })).toThrow();
    expect(() => service.createReservation({ userId: 1, roomId: 2, checkOut: '2025-09-22' })).toThrow();
    expect(() => service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-20' })).toThrow();
  });

  it('deve lançar erro para IDs inválidos', () => {
    expect(() => service.createReservation({ userId: -1, roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' })).toThrow();
    expect(() => service.createReservation({ userId: 1, roomId: 0, checkIn: '2025-09-20', checkOut: '2025-09-22' })).toThrow();
    expect(() => service.createReservation({ userId: 'a', roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' })).toThrow();
  });

  it('deve lançar erro para datas inválidas', () => {
    expect(() => service.createReservation({ userId: 1, roomId: 2, checkIn: 'data', checkOut: '2025-09-22' })).toThrow();
    expect(() => service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-20', checkOut: 'data' })).toThrow();
    expect(() => service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-22', checkOut: '2025-09-20' })).toThrow();
    expect(() => service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-22', checkOut: '2025-09-22' })).toThrow();
  });

  it('deve lançar erro se houver sobreposição de reserva', () => {
    service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' });
    expect(() => service.createReservation({ userId: 2, roomId: 2, checkIn: '2025-09-21', checkOut: '2025-09-23' })).toThrow();
  });

  it('deve usar userId como guestId se guestId não for fornecido', () => {
    const res = service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' });
    expect(res.guestId).toBe(1);
  });

  it('deve retornar todas as reservas', () => {
    service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' });
    service.createReservation({ userId: 2, roomId: 3, checkIn: '2025-09-23', checkOut: '2025-09-25' });
    expect(service.getAllReservations().length).toBe(2);
  });

  it('deve realizar check-in corretamente', () => {
    const res = service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' });
    const checked = service.checkIn(res.id);
    expect(checked.checkInStatus).toBe(true);
  });

  it('deve lançar erro se reserva não encontrada no check-in', () => {
    expect(() => service.checkIn(999)).toThrow();
  });

  it('deve lançar erro se check-in já realizado', () => {
    const res = service.createReservation({ userId: 1, roomId: 2, checkIn: '2025-09-20', checkOut: '2025-09-22' });
    service.checkIn(res.id);
    expect(() => service.checkIn(res.id)).toThrow();
  });
});
