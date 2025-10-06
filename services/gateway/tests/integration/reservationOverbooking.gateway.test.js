// reservationOverbooking.gateway.test.js
// Teste migrado do antigo integration: overbooking via gateway
import axios from 'axios';

describe('Overbooking de reservas (via gateway)', () => {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3005';
  let recepToken;

  beforeAll(async () => {
  const username = `recep6_${Date.now()}`;
  await axios.post(`${GATEWAY_URL}/register`, { username, password: '123456', role: 'recepcionista' });
  recepToken = (await axios.post(`${GATEWAY_URL}/login`, { username, password: '123456' })).data.token;
  });

  it('não permite overbooking para o mesmo quarto e período', async () => {
    // Cria primeira reserva
  const res1 = await axios.post(`${GATEWAY_URL}/reservations`, {
      userId: 1,
      roomId: 501,
      checkIn: '2025-11-01',
      checkOut: '2025-11-05',
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res1.status).toBe(201);

    // Tenta criar segunda reserva para o mesmo quarto e período
    await expect(
  axios.post(`${GATEWAY_URL}/reservations`, {
        userId: 2,
        roomId: 501,
        checkIn: '2025-11-03',
        checkOut: '2025-11-06',
      }, {
        headers: { Authorization: `Bearer ${recepToken}` }
      })
    ).rejects.toThrow();
  });
});
