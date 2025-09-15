
const axios = require('axios');

describe('Pagamento e status da reserva (com autenticação e roles)', () => {
  const USER_URL = process.env.USER_URL || 'http://localhost:3000';
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const baseReservation = 'http://localhost:3002';
  const basePayment = 'http://localhost:3003';
  let recepToken, reservation;

  beforeAll(async () => {
    await axios.post(`${USER_URL}/register`, { username: 'recep7', password: '123', role: 'recepcionista' });
    recepToken = (await axios.post(`${AUTH_URL}/login`, { username: 'recep7', password: '123' })).data.token;

    // Cria reserva
    const res = await axios.post(`${baseReservation}/reservations`, {
      userId: 1,
      roomId: 201,
      checkIn: '2025-09-25',
      checkOut: '2025-09-27',
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation = res.data;
  });

  it('cria pagamento e atualiza status da reserva para pago', async () => {
    try {
      // Cria pagamento
      const payRes = await axios.post(`${basePayment}/payments`, {
        reservationId: reservation.id,
        amount: 500,
        method: 'pix',
        status: 'pago',
      });
      expect(payRes.status).toBe(201);
      expect(payRes.data.status).toBe('pago');

      // Consulta reserva
      const res2 = await axios.get(`${baseReservation}/reservations`, {
        headers: { Authorization: `Bearer ${recepToken}` }
      });
      const updated = res2.data.find(r => r.id === reservation.id);
      expect(updated.paymentStatus).toBe('pago');
    } catch (err) {
      if (err.response) {
        console.error('Erro detalhado:', err.response.data);
      }
      throw err;
    }
  });
});
