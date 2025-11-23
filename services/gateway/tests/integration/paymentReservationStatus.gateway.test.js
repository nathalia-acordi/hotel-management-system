

import axios from 'axios';

describe('Pagamento e status da reserva (via gateway)', () => {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3005';
  let recepToken, reservation;

  beforeAll(async () => {
    
  const username = `recep7_${Date.now()}`;
  await axios.post(`${GATEWAY_URL}/register`, { username, password: '123456', role: 'recepcionista' });
  recepToken = (await axios.post(`${GATEWAY_URL}/login`, { username, password: '123456' })).data.token;

  
  const res = await axios.post(`${GATEWAY_URL}/reservations`, {
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
    
  const payRes = await axios.post(`${GATEWAY_URL}/payments`, {
      reservationId: reservation.id,
      amount: 500,
      method: 'pix',
      status: 'pago',
    });
    expect(payRes.status).toBe(201);
    expect(payRes.data.status).toBe('pago');

    
  const res2 = await axios.get(`${GATEWAY_URL}/reservations`, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    const updated = res2.data.find(r => r.id === reservation.id);
    expect(updated.paymentStatus).toBe('pago');
  });
});
