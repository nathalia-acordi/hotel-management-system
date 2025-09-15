const axios = require('axios');

describe('Cancelamento de reserva', () => {
  let reservation;
  const baseUrl = 'http://localhost:3002';

  beforeAll(async () => {
    // Cria uma reserva para cancelar
    const res = await axios.post(`${baseUrl}/reservations`, {
      userId: 1,
      roomId: 101,
      checkIn: '2025-09-20',
      checkOut: '2025-09-22',
    });
    reservation = res.data;
  });

  it('cancela uma reserva existente', async () => {
    const res = await axios.post(`${baseUrl}/reservations/${reservation.id}/cancel`);
    expect(res.status).toBe(200);
    expect(res.data.cancelled).toBe(true);
  });

  it('não permite cancelar duas vezes', async () => {
    try {
      await axios.post(`${baseUrl}/reservations/${reservation.id}/cancel`);
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
    });
    const reservation2 = res2.data;
    // Faz check-in e check-out
    await axios.post(`${baseUrl}/reservations/${reservation2.id}/checkin`);
    await axios.post(`${baseUrl}/reservations/${reservation2.id}/checkout`);
    // Tenta cancelar
    try {
      await axios.post(`${baseUrl}/reservations/${reservation2.id}/cancel`);
      throw new Error('Deveria ter falhado');
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toMatch(/já finalizada/);
    }
  });
});
