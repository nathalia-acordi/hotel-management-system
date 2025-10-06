// reservationCheckinCheckout.gateway.test.js
// Teste migrado do antigo integration: check-in e check-out via gateway
import axios from 'axios';

describe('Check-in e check-out (via gateway)', () => {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3005';
  let recepToken, reservation;

  beforeAll(async () => {
  const username = `recep4_${Date.now()}`;
  await axios.post(`${GATEWAY_URL}/register`, { username, password: '123456', role: 'recepcionista' });
  recepToken = (await axios.post(`${GATEWAY_URL}/login`, { username, password: '123456' })).data.token;
  const res = await axios.post(`${GATEWAY_URL}/reservations`, {
      userId: 1,
      roomId: 302,
      checkIn: '2025-09-25',
      checkOut: '2025-09-27',
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation = res.data;
  });

  it('realiza check-in e check-out com sucesso', async () => {
  const checkinRes = await axios.patch(`${GATEWAY_URL}/reservations/${reservation.id}/checkin`, {}, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(checkinRes.status).toBe(200);
    expect(checkinRes.data.status).toBe('ocupada');

  const checkoutRes = await axios.patch(`${GATEWAY_URL}/reservations/${reservation.id}/checkout`, {}, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.data.status).toBe('finalizada');
  });
});
