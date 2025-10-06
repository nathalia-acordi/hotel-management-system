// reservationCancel.gateway.test.js
// Teste migrado do antigo integration: cancelamento de reserva via gateway
import axios from 'axios';

describe('Cancelamento de reserva (via gateway)', () => {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3005';
  let recepToken, reservation;

  beforeAll(async () => {
  const username = `recep3_${Date.now()}`;
  await axios.post(`${GATEWAY_URL}/register`, { username, password: '123456', role: 'recepcionista' });
  recepToken = (await axios.post(`${GATEWAY_URL}/login`, { username, password: '123456' })).data.token;
  const res = await axios.post(`${GATEWAY_URL}/reservations`, {
      userId: 1,
      roomId: 301,
      checkIn: '2025-09-25',
      checkOut: '2025-09-27',
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation = res.data;
  });

  it('cancela reserva com sucesso', async () => {
  const cancelRes = await axios.patch(`${GATEWAY_URL}/reservations/${reservation.id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.data.status).toBe('cancelada');
  });
});
