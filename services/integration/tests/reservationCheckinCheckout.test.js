// reservationCheckinCheckout.test.js
// Teste de integração: fluxo de check-in e check-out de reservas
// - Garante que apenas recepcionista pode realizar check-in/out
// - Valida restrições para user comum e erros de fluxo (duplo check-in, etc)

const axios = require('axios');

describe('Reserva - Check-in e Check-out (com autenticação e roles)', () => {
  const USER_URL = process.env.USER_URL || 'http://localhost:3000';
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';
  let recepToken, userToken, reserva;

  beforeAll(async () => {
    // Cadastra usuários e obtém tokens
    await axios.post(`${USER_URL}/register`, { username: 'recep5', password: '123', role: 'recepcionista' });
    await axios.post(`${USER_URL}/register`, { username: 'user5', password: '123', role: 'user' });
    recepToken = (await axios.post(`${AUTH_URL}/login`, { username: 'recep5', password: '123' })).data.token;
    userToken = (await axios.post(`${AUTH_URL}/login`, { username: 'user5', password: '123' })).data.token;
  });

  it('recepcionista pode criar uma reserva', async () => {
    // Testa criação de reserva
    const res = await axios.post(`${RESERVATION_URL}/reservations`, {
      userId: 10,
      roomId: 88,
      checkIn: '2025-11-01',
      checkOut: '2025-11-05'
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res.status).toBe(201);
    reserva = res.data;
  });

  it('user comum NÃO pode fazer check-in', async () => {
    // Testa restrição de permissão
    await expect(
      axios.post(`${RESERVATION_URL}/reservations/${reserva.id}/checkin`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });

  it('recepcionista pode fazer check-in', async () => {
    // Testa fluxo de check-in
    const res = await axios.post(`${RESERVATION_URL}/reservations/${reserva.id}/checkin`, {}, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.data.checkInStatus).toBe(true);
  });

  it('recepcionista pode fazer check-out após check-in', async () => {
    // Testa fluxo de check-out
    const res = await axios.post(`${RESERVATION_URL}/reservations/${reserva.id}/checkout`, {}, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.data.checkOutStatus).toBe(true);
  });

  it('não permite check-in duplo', async () => {
    // Testa erro de fluxo: check-in duplo
    try {
      await axios.post(`${RESERVATION_URL}/reservations/${reserva.id}/checkin`, {}, {
        headers: { Authorization: `Bearer ${recepToken}` }
      });
      throw new Error('Deveria ter falhado');
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toMatch(/check-in já realizado/i);
    }
  });

  it('não permite check-out sem check-in', async () => {
    // Cria nova reserva
    const res2 = await axios.post(`${RESERVATION_URL}/reservations`, {
      userId: 11,
      roomId: 89,
      checkIn: '2025-11-10',
      checkOut: '2025-11-12'
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    try {
      await axios.post(`${RESERVATION_URL}/reservations/${res2.data.id}/checkout`, {}, {
        headers: { Authorization: `Bearer ${recepToken}` }
      });
      throw new Error('Deveria ter falhado');
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toMatch(/check-in não realizado/i);
    }
  });
});
