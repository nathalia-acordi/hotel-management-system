// Teste de integração para overbooking
const axios = require('axios');

describe('Reserva - Overbooking', () => {
  const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';

  let reserva1;

  it('deve permitir reservar um quarto disponível', async () => {
    const res = await axios.post(`${RESERVATION_URL}/reservations`, {
      userId: 1,
      roomId: 99,
      checkIn: '2025-10-01',
      checkOut: '2025-10-05'
    });
    expect(res.status).toBe(201);
    reserva1 = res.data;
  });

  it('deve rejeitar reserva sobreposta para o mesmo quarto', async () => {
    try {
      await axios.post(`${RESERVATION_URL}/reservations`, {
        userId: 2,
        roomId: 99,
        checkIn: '2025-10-03',
        checkOut: '2025-10-07'
      });
      throw new Error('Deveria ter falhado');
    } catch (err) {
      if (err.response) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.error).toMatch(/quarto já reservado/i);
      } else {
        // Se não houver response, valida mensagem de erro lançada
        expect(err.message).toMatch(/quarto já reservado/i);
      }
    }
  });
});
