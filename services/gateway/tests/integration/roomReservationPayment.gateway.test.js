// roomReservationPayment.gateway.test.js
// Teste migrado do antigo integration: pagamento de reserva de quarto via gateway
import axios from 'axios';

describe('Pagamento de reserva de quarto (via gateway)', () => {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3005';
  let recepToken, reservation;

  beforeAll(async () => {
  const username = `recep8_${Date.now()}`;
  await axios.post(`${GATEWAY_URL}/register`, { username, password: '123456', role: 'recepcionista' });
  recepToken = (await axios.post(`${GATEWAY_URL}/login`, { username, password: '123456' })).data.token;
  const res = await axios.post(`${GATEWAY_URL}/reservations`, {
      userId: 1,
      roomId: 601,
      checkIn: '2025-12-01',
      checkOut: '2025-12-05',
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation = res.data;
  });

  it('realiza pagamento da reserva', async () => {
  const payRes = await axios.post(`${GATEWAY_URL}/payments`, {
      reservationId: reservation.id,
      amount: 1000,
      method: 'cartao',
      status: 'pago',
    });
    expect(payRes.status).toBe(201);
    expect(payRes.data.status).toBe('pago');
  });
});
