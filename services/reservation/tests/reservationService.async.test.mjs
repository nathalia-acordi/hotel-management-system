import { ReservationService } from '../src/application/ReservationService.js';

describe('ReservationService (async branches)', () => {
  it('handles async findAll and async save (no overlap)', async () => {
    const repo = {
      data: [],
      findAll: () => Promise.resolve([]),
      save: (r) => Promise.resolve({ ...r, id: 'saved-1' }),
      findById: (id) => Promise.resolve(null),
      update: (r) => Promise.resolve(r),
    };
    const svc = new ReservationService(repo);
    const res = await svc.createReservation({ userId: 1, roomId: 2, checkIn: '2025-12-01', checkOut: '2025-12-03' });
    expect(res).toHaveProperty('id', 'saved-1');
    expect(res.userId).toBe(1);
  });

  it('detects overlapping reservations when findAll is async iterable-like', async () => {
    const existing = { id: 'r1', roomId: 2, checkIn: '2025-12-02', checkOut: '2025-12-05' };
    // findAll returns a Promise resolving to an object with toArray()
    const repo = {
      findAll: () => Promise.resolve({ toArray: () => Promise.resolve([existing]) }),
      save: (r) => Promise.resolve({ ...r, id: 'saved-2' }),
    };
    const svc = new ReservationService(repo);
    await expect(svc.createReservation({ userId: 3, roomId: 2, checkIn: '2025-12-03', checkOut: '2025-12-04' })).rejects.toThrow('Quarto já reservado');
  });

  it('getAllReservations forwards promise results', async () => {
    const repo = { findAll: () => Promise.resolve([{ id: 'x' }]) };
    const svc = new ReservationService(repo);
    const all = await svc.getAllReservations();
    expect(Array.isArray(all)).toBe(true);
    expect(all[0].id).toBe('x');
  });

  it('checkIn/checkOut/cancel/updatePaymentStatus work with async repo methods', async () => {
    const base = { id: 'a', userId: 1, roomId: 2, checkIn: '2025-12-01', checkOut: '2025-12-02' };
    let store = { ...base };
    const repo = {
      findById: (id) => Promise.resolve(id === 'a' ? store : null),
      update: (r) => { store = { ...r }; return Promise.resolve(store); },
    };
    const svc = new ReservationService(repo);

    const checked = await svc.checkIn('a');
    expect(checked.checkInStatus).toBe(true);

    const checkedOut = await svc.checkOut('a');
    expect(checkedOut.checkOutStatus).toBe(true);

    await expect(svc.cancelReservation('a')).rejects.toThrow('Reserva já finalizada');

    // reset and test cancel
    store = { ...base };
    const svc2 = new ReservationService(repo);
    const canceled = await svc2.cancelReservation('a');
    expect(canceled.cancelled).toBe(true);

    // update payment
    store = { ...base };
    const svc3 = new ReservationService(repo);
    const paid = await svc3.updatePaymentStatus('a', 'paid');
    expect(paid.paymentStatus).toBe('paid');
  });
});
