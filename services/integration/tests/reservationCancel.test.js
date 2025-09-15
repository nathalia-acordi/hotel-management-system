const axios = require('axios');

describe('Cancelamento de reserva (com autenticação e roles)', () => {
  const USER_URL = process.env.USER_URL || 'http://localhost:3000';
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const baseUrl = 'http://localhost:3002';
  let recepToken, userToken, reservation;

  beforeAll(async () => {
    await axios.post(`${USER_URL}/register`, { username: 'recep6', password: '123', role: 'recepcionista' });
    await axios.post(`${USER_URL}/register`, { username: 'user6', password: '123', role: 'user' });
    recepToken = (await axios.post(`${AUTH_URL}/login`, { username: 'recep6', password: '123' })).data.token;
    userToken = (await axios.post(`${AUTH_URL}/login`, { username: 'user6', password: '123' })).data.token;

    // Cria uma reserva para cancelar
    const res = await axios.post(`${baseUrl}/reservations`, {
      userId: 1,
      roomId: 101,
      checkIn: '2025-09-20',
      checkOut: '2025-09-22',
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation = res.data;
  });

  it('recepcionista pode cancelar uma reserva existente', async () => {
    const res = await axios.post(`${baseUrl}/reservations/${reservation.id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.data.cancelled).toBe(true);
  });

  it('user comum NÃO pode cancelar reserva', async () => {
    await expect(
      axios.post(`${baseUrl}/reservations/${reservation.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });

  it('não permite cancelar duas vezes', async () => {
    try {
      await axios.post(`${baseUrl}/reservations/${reservation.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${recepToken}` }
      });
      throw new Error('Deveria ter falhado');
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toMatch(/já cancelada/);
    }
  });

  it('não permite cancelar reserva já finalizada (check-out)', async () => {
    // Cria nova reserva
    const res2 = await axios.post(`${baseUrl}/reservations`, {
      userId: 2,
      roomId: 102,
      checkIn: '2025-09-21',
      checkOut: '2025-09-23',
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    const reservation2 = res2.data;
    // Faz check-in e check-out
    await axios.post(`${baseUrl}/reservations/${reservation2.id}/checkin`, {}, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    await axios.post(`${baseUrl}/reservations/${reservation2.id}/checkout`, {}, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    // Tenta cancelar
    try {
      await axios.post(`${baseUrl}/reservations/${reservation2.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${recepToken}` }
      });
      throw new Error('Deveria ter falhado');
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toMatch(/já finalizada/);
    }
  });
});
