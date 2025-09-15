const axios = require('axios');

describe('Pagamento e status da reserva', () => {
  const baseReservation = 'http://localhost:3002';
  const basePayment = 'http://localhost:3003';
  let reservation;

  beforeAll(async () => {
    // Cria reserva
    const res = await axios.post(`${baseReservation}/reservations`, {
      userId: 1,
      roomId: 201,
      checkIn: '2025-09-25',
      checkOut: '2025-09-27',
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
      const res2 = await axios.get(`${baseReservation}/reservations`);
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
