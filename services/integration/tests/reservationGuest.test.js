// reservationGuest.test.js
// Teste de integração: reserva para terceiros (guestId ≠ userId)
// - Garante que apenas recepcionista pode criar reserva para outro hóspede
// - Valida restrição para user comum

const axios = require('axios');

describe('Reserva para terceiros (guestId ≠ userId, com autenticação e roles)', () => {
  const USER_URL = process.env.USER_URL || 'http://localhost:3000';
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const baseReservation = 'http://localhost:3002';
  let guest, recepToken, userToken, userId = 1;

  beforeAll(async () => {
    // Cadastra usuários e obtém tokens
    await axios.post(`${USER_URL}/register`, { username: 'recep4', password: '123', role: 'recepcionista' });
    await axios.post(`${USER_URL}/register`, { username: 'user4', password: '123', role: 'user' });
    recepToken = (await axios.post(`${AUTH_URL}/login`, { username: 'recep4', password: '123' })).data.token;
    userToken = (await axios.post(`${AUTH_URL}/login`, { username: 'user4', password: '123' })).data.token;

    // Cadastra hóspede
    const res = await axios.post(`${baseReservation}/guests`, {
      name: 'Maria da Silva',
      document: '12345678900',
      email: 'maria@exemplo.com',
      phone: '11999999999'
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    guest = res.data;
  });

  it('recepcionista pode criar reserva para hóspede diferente do usuário', async () => {
    // Testa fluxo de reserva para terceiros
    const res = await axios.post(`${baseReservation}/reservations`, {
      userId,
      guestId: guest.id,
      roomId: 301,
      checkIn: '2025-10-01',
      checkOut: '2025-10-05'
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res.status).toBe(201);
    expect(res.data.userId).toBe(userId);
    expect(res.data.guestId).toBe(guest.id);
    expect(res.data.roomId).toBe(301);
    // Consulta reservas e verifica hóspede
    const all = await axios.get(`${baseReservation}/reservations`, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    const found = all.data.find(r => r.id === res.data.id);
    expect(found.guestId).toBe(guest.id);
  });

  it('user comum NÃO pode criar reserva para terceiros', async () => {
    // Testa restrição para user comum
    await expect(
      axios.post(`${baseReservation}/reservations`, {
        userId: 2,
        guestId: guest.id,
        roomId: 302,
        checkIn: '2025-10-10',
        checkOut: '2025-10-12'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });
});
