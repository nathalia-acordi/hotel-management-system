
// Teste de integração Room/Reservation/Payment com autenticação e roles
const axios = require('axios');

describe('Fluxo de reserva e pagamento (com autenticação e roles)', () => {
  const USER_URL = process.env.USER_URL || 'http://localhost:3000';
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const ROOM_URL = process.env.ROOM_URL || 'http://localhost:3004';
  const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';
  const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:3003';

  let adminToken, recepToken, userToken;
  let room;
  let reservation;
  let payment;

  beforeAll(async () => {
    // Cadastra usuários
    await axios.post(`${USER_URL}/register`, { username: 'admin', password: '123', role: 'admin' });
    await axios.post(`${USER_URL}/register`, { username: 'recep', password: '123', role: 'recepcionista' });
    await axios.post(`${USER_URL}/register`, { username: 'user', password: '123', role: 'user' });

    // Faz login e pega tokens
    adminToken = (await axios.post(`${AUTH_URL}/login`, { username: 'admin', password: '123' })).data.token;
    recepToken = (await axios.post(`${AUTH_URL}/login`, { username: 'recep', password: '123' })).data.token;
    userToken = (await axios.post(`${AUTH_URL}/login`, { username: 'user', password: '123' })).data.token;
  });

  it('admin pode criar um quarto', async () => {
    const res = await axios.post(`${ROOM_URL}/rooms`, {
      number: '101',
      type: 'single',
      price: 200
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(201);
    room = res.data;
    expect(room).toHaveProperty('id');
  });

  it('user comum NÃO pode criar um quarto', async () => {
    await expect(
      axios.post(`${ROOM_URL}/rooms`, {
        number: '102', type: 'single', price: 200
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });

  it('recepcionista NÃO pode criar um quarto', async () => {
    await expect(
      axios.post(`${ROOM_URL}/rooms`, {
        number: '103', type: 'single', price: 200
      }, {
        headers: { Authorization: `Bearer ${recepToken}` }
      })
    ).rejects.toThrow(/403/);
  });

  it('recepcionista pode criar reserva', async () => {
    const res = await axios.post(`${RESERVATION_URL}/reservations`, {
      userId: 2,
      roomId: room.id,
      checkIn: '2025-09-15',
      checkOut: '2025-09-16'
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res.status).toBe(201);
    reservation = res.data;
    expect(reservation).toHaveProperty('id');
  });

  it('user comum NÃO pode criar reserva', async () => {
    await expect(
      axios.post(`${RESERVATION_URL}/reservations`, {
        userId: 3,
        roomId: room.id,
        checkIn: '2025-09-17',
        checkOut: '2025-09-18'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });

  it('admin pode criar reserva', async () => {
    const res = await axios.post(`${RESERVATION_URL}/reservations`, {
      userId: 1,
      roomId: room.id,
      checkIn: '2025-09-19',
      checkOut: '2025-09-20'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(201);
  });

  it('deve realizar o pagamento da reserva', async () => {
    const res = await axios.post(`${PAYMENT_URL}/payments`, {
      reservationId: reservation.id,
      amount: 200,
      method: 'credit_card'
    });
    expect(res.status).toBe(201);
    payment = res.data;
    expect(payment).toHaveProperty('id');
  });
});
