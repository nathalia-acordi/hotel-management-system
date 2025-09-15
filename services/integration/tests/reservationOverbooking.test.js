
const axios = require('axios');

describe('Reserva - Overbooking (com autenticação e roles)', () => {
  const USER_URL = process.env.USER_URL || 'http://localhost:3000';
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';

  let recepToken, userToken;
  let reserva1;

  beforeAll(async () => {
    await axios.post(`${USER_URL}/register`, { username: 'recep3', password: '123', role: 'recepcionista' });
    await axios.post(`${USER_URL}/register`, { username: 'user3', password: '123', role: 'user' });
    recepToken = (await axios.post(`${AUTH_URL}/login`, { username: 'recep3', password: '123' })).data.token;
    userToken = (await axios.post(`${AUTH_URL}/login`, { username: 'user3', password: '123' })).data.token;
  });

  it('recepcionista pode reservar um quarto disponível', async () => {
    const res = await axios.post(`${RESERVATION_URL}/reservations`, {
      userId: 1,
      roomId: 99,
      checkIn: '2025-10-01',
      checkOut: '2025-10-05'
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res.status).toBe(201);
    reserva1 = res.data;
  });

  it('user comum NÃO pode reservar', async () => {
    await expect(
      axios.post(`${RESERVATION_URL}/reservations`, {
        userId: 2,
        roomId: 99,
        checkIn: '2025-10-03',
        checkOut: '2025-10-07'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });

  it('deve rejeitar reserva sobreposta para o mesmo quarto (recepcionista)', async () => {
    try {
      await axios.post(`${RESERVATION_URL}/reservations`, {
        userId: 3,
        roomId: 99,
        checkIn: '2025-10-03',
        checkOut: '2025-10-07'
      }, {
        headers: { Authorization: `Bearer ${recepToken}` }
      });
      throw new Error('Deveria ter falhado');
    } catch (err) {
      if (err.response) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.error).toMatch(/quarto já reservado/i);
      } else {
        expect(err.message).toMatch(/quarto já reservado/i);
      }
    }
  });
});
