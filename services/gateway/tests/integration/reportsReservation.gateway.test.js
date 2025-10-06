// reportsReservation.gateway.test.js
// Teste migrado do antigo integration: relatórios e consultas de reservas via gateway
import axios from 'axios';

describe('Relatórios e consultas (via gateway)', () => {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3005';
  let adminToken, recepToken, userToken;
  let reservation1, reservation2;

  beforeAll(async () => {
    // Cadastra usuários e obtém tokens via gateway
  const adminUsername = `admin2_${Date.now()}`;
  const recepUsername = `recep2_${Date.now()}`;
  const userUsername = `user2_${Date.now()}`;
  await axios.post(`${GATEWAY_URL}/register`, { username: adminUsername, password: '123456', role: 'admin' });
  await axios.post(`${GATEWAY_URL}/register`, { username: recepUsername, password: '123456', role: 'recepcionista' });
  await axios.post(`${GATEWAY_URL}/register`, { username: userUsername, password: '123456', role: 'user' });

  adminToken = (await axios.post(`${GATEWAY_URL}/login`, { username: adminUsername, password: '123456' })).data.token;
  recepToken = (await axios.post(`${GATEWAY_URL}/login`, { username: recepUsername, password: '123456' })).data.token;
  userToken = (await axios.post(`${GATEWAY_URL}/login`, { username: userUsername, password: '123456' })).data.token;

    // Cadastra hóspedes via gateway
    async function getOrCreateGuest(name, document, email, phone) {
      try {
        return (await axios.post(`${GATEWAY_URL}/guests`, { name, document, email, phone }, {
          headers: { Authorization: `Bearer ${recepToken}` }
        })).data;
      } catch (err) {
        if (err.response && err.response.status === 409) {
          // Já existe, buscar pelo documento
          const all = (await axios.get(`${GATEWAY_URL}/guests`, {
            headers: { Authorization: `Bearer ${recepToken}` }
          })).data;
          return all.find(g => g.document === document);
        }
        throw err;
      }
    }
    const guest1 = await getOrCreateGuest('Hóspede 1', '111', 'h1@ex.com', '1111');
    const guest2 = await getOrCreateGuest('Hóspede 2', '222', 'h2@ex.com', '2222');
    const guest3 = await getOrCreateGuest('Hóspede 3', '333', 'h3@ex.com', '3333');

    // Cria duas reservas pagas e uma pendente via gateway
    const res1 = await axios.post(`${GATEWAY_URL}/reservations`, {
      userId: 1,
      roomId: 401,
      checkIn: '2025-10-10',
      checkOut: '2025-10-12',
      guestId: guest1.id
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation1 = res1.data;
  await axios.patch(`${GATEWAY_URL}/reservations/${reservation1.id}/payment`, { paymentStatus: 'pago' }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation1.amount = 300;
  await axios.patch(`${GATEWAY_URL}/reservations/${reservation1.id}/amount`, { amount: 300 }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });

  const res2 = await axios.post(`${GATEWAY_URL}/reservations`, {
      userId: 2,
      roomId: 402,
      checkIn: '2025-10-11',
      checkOut: '2025-10-13',
      guestId: guest2.id
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation2 = res2.data;
  await axios.patch(`${GATEWAY_URL}/reservations/${reservation2.id}/payment`, { paymentStatus: 'pago' }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    reservation2.amount = 500;
  await axios.patch(`${GATEWAY_URL}/reservations/${reservation2.id}/amount`, { amount: 500 }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });

  await axios.post(`${GATEWAY_URL}/reservations`, {
      userId: 3,
      roomId: 403,
      checkIn: '2025-10-10',
      checkOut: '2025-10-12',
      guestId: guest3.id
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
  });

  it('admin pode listar reservas ativas', async () => {
  const res = await axios.get(`${GATEWAY_URL}/reservations/active`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.some(r => r.id === reservation1.id)).toBe(true);
  });

  it('user comum NÃO pode listar reservas ativas', async () => {
    await expect(
    axios.get(`${GATEWAY_URL}/reservations/active`, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });

  it('recepcionista pode consultar ocupação de quartos em uma data', async () => {
  const res = await axios.get(`${GATEWAY_URL}/rooms/occupancy?date=2025-10-11`, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.some(r => r.roomId === 401)).toBe(true);
    expect(res.data.some(r => r.roomId === 402)).toBe(true);
  });

  it('user comum NÃO pode consultar ocupação', async () => {
    await expect(
    axios.get(`${GATEWAY_URL}/rooms/occupancy?date=2025-10-11`, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });

  it('admin pode calcular faturamento no período', async () => {
  const res = await axios.get(`${GATEWAY_URL}/reports/revenue?start=2025-10-09&end=2025-10-14`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.data.count).toBeGreaterThanOrEqual(2);
    expect(res.data.total).toBeGreaterThanOrEqual(800);
  });

  it('user comum NÃO pode calcular faturamento', async () => {
    await expect(
    axios.get(`${GATEWAY_URL}/reports/revenue?start=2025-10-09&end=2025-10-14`, {
        headers: { Authorization: `Bearer ${userToken}` }
      })
    ).rejects.toThrow(/403/);
  });
});
