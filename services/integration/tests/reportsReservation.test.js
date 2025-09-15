const axios = require('axios');

describe('Relatórios e consultas', () => {
  const baseReservation = 'http://localhost:3002';
  let reservation1, reservation2;

  beforeAll(async () => {
    // Cadastra hóspedes
    async function getOrCreateGuest(name, document, email, phone) {
      try {
        return (await axios.post(`${baseReservation}/guests`, { name, document, email, phone })).data;
      } catch (err) {
        if (err.response && err.response.status === 409) {
          // Já existe, buscar pelo documento
          const all = (await axios.get(`${baseReservation}/guests`)).data;
          return all.find(g => g.document === document);
        }
        throw err;
      }
    }
    const guest1 = await getOrCreateGuest('Hóspede 1', '111', 'h1@ex.com', '1111');
    const guest2 = await getOrCreateGuest('Hóspede 2', '222', 'h2@ex.com', '2222');
    const guest3 = await getOrCreateGuest('Hóspede 3', '333', 'h3@ex.com', '3333');

    // Cria duas reservas pagas e uma pendente
    const res1 = await axios.post(`${baseReservation}/reservations`, {
      userId: 1,
      roomId: 401,
      checkIn: '2025-10-10',
      checkOut: '2025-10-12',
      guestId: guest1.id
    });
    reservation1 = res1.data;
    await axios.patch(`${baseReservation}/reservations/${reservation1.id}/payment`, { paymentStatus: 'pago' });
    reservation1.amount = 300;
    await axios.patch(`${baseReservation}/reservations/${reservation1.id}/amount`, { amount: 300 });

    const res2 = await axios.post(`${baseReservation}/reservations`, {
      userId: 2,
      roomId: 402,
      checkIn: '2025-10-11',
      checkOut: '2025-10-13',
      guestId: guest2.id
    });
    reservation2 = res2.data;
    await axios.patch(`${baseReservation}/reservations/${reservation2.id}/payment`, { paymentStatus: 'pago' });
    reservation2.amount = 500;
    await axios.patch(`${baseReservation}/reservations/${reservation2.id}/amount`, { amount: 500 });

    await axios.post(`${baseReservation}/reservations`, {
      userId: 3,
      roomId: 403,
      checkIn: '2025-10-10',
      checkOut: '2025-10-12',
      guestId: guest3.id
    });
  });

  it('deve listar reservas ativas', async () => {
    const res = await axios.get(`${baseReservation}/reservations/active`);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.some(r => r.id === reservation1.id)).toBe(true);
  });

  it('deve consultar ocupação de quartos em uma data', async () => {
    const res = await axios.get(`${baseReservation}/rooms/occupancy?date=2025-10-11`);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.some(r => r.roomId === 401)).toBe(true);
    expect(res.data.some(r => r.roomId === 402)).toBe(true);
  });

  it('deve calcular faturamento no período', async () => {
    const res = await axios.get(`${baseReservation}/reports/revenue?start=2025-10-09&end=2025-10-14`);
    expect(res.data.count).toBeGreaterThanOrEqual(2);
    // O campo total depende do amount estar salvo na reserva
    expect(res.data.total).toBeGreaterThanOrEqual(800);
  });
});
