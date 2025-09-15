// Teste de integração para check-in e check-out
const axios = require('axios');

describe('Reserva - Check-in e Check-out', () => {
  const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';
  let reserva;

  it('deve criar uma reserva', async () => {
    const res = await axios.post(`${RESERVATION_URL}/reservations`, {
      userId: 10,
      roomId: 88,
      checkIn: '2025-11-01',
      checkOut: '2025-11-05'
    });
    expect(res.status).toBe(201);
    reserva = res.data;
  });

  it('deve permitir check-in', async () => {
    const res = await axios.post(`${RESERVATION_URL}/reservations/${reserva.id}/checkin`);
    expect(res.status).toBe(200);
    expect(res.data.checkInStatus).toBe(true);
  });

  it('deve permitir check-out após check-in', async () => {
    const res = await axios.post(`${RESERVATION_URL}/reservations/${reserva.id}/checkout`);
    expect(res.status).toBe(200);
    expect(res.data.checkOutStatus).toBe(true);
  });

  it('não permite check-in duplo', async () => {
    try {
      await axios.post(`${RESERVATION_URL}/reservations/${reserva.id}/checkin`);
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
    });
    try {
      await axios.post(`${RESERVATION_URL}/reservations/${res2.data.id}/checkout`);
      throw new Error('Deveria ter falhado');
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toMatch(/check-in não realizado/i);
    }
  });
});
