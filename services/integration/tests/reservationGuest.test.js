const axios = require('axios');

describe('Reserva para terceiros (guestId ≠ userId)', () => {
  const baseReservation = 'http://localhost:3002';
  let guest, userId = 1;

  beforeAll(async () => {
    // Cadastra hóspede
    const res = await axios.post(`${baseReservation}/guests`, {
      name: 'Maria da Silva',
      document: '12345678900',
      email: 'maria@exemplo.com',
      phone: '11999999999'
    });
    guest = res.data;
  });

  it('cria reserva para hóspede diferente do usuário', async () => {
    // Cria reserva para guestId diferente do userId
    const res = await axios.post(`${baseReservation}/reservations`, {
      userId,
      guestId: guest.id,
      roomId: 301,
      checkIn: '2025-10-01',
      checkOut: '2025-10-05'
    });
    expect(res.status).toBe(201);
    expect(res.data.userId).toBe(userId);
    expect(res.data.guestId).toBe(guest.id);
    expect(res.data.roomId).toBe(301);
    // Consulta reservas e verifica hóspede
    const all = await axios.get(`${baseReservation}/reservations`);
    const found = all.data.find(r => r.id === res.data.id);
    expect(found.guestId).toBe(guest.id);
  });
});
