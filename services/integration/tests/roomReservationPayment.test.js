// Teste de integração Room/Reservation/Payment
const axios = require('axios');

describe('Fluxo de reserva e pagamento', () => {
  const ROOM_URL = process.env.ROOM_URL || 'http://localhost:3004';
  const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';
  const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:3003';

  let room;
  let reservation;
  let payment;

  it('deve criar um quarto', async () => {
    const res = await axios.post(`${ROOM_URL}/rooms`, {
      number: '101',
      type: 'single',
      price: 200
    });
    expect(res.status).toBe(201);
    room = res.data;
    expect(room).toHaveProperty('id');
  });

  it('deve criar uma reserva', async () => {
    const res = await axios.post(`${RESERVATION_URL}/reservations`, {
      userId: 1,
      roomId: room.id,
      checkIn: '2025-09-15',
      checkOut: '2025-09-16'
    });
    expect(res.status).toBe(201);
    reservation = res.data;
    expect(reservation).toHaveProperty('id');
  });

  it('deve realizar o pagamento da reserva', async () => {
    const res = await axios.post(`${PAYMENT_URL}/payments`, {
      reservationId: reservation.id,
      amount: 200,
      method: 'credit_card'
    });
    expect(res.status).toBe(201);
    payment = res.data;
    expect(payment).toHaveProperty('id');
  });
});
