import request from 'supertest';
import { createApp } from '../src/index.js';
import jwt from 'jsonwebtoken';

// Middlewares mockados para testes sem autenticação real
const mockAuth = (req, res, next) => { req.user = { role: 'recepcionista' }; next(); };
const mockIsRecepcionista = (req, res, next) => { next(); };
const appMock = createApp({ authenticateJWT: mockAuth, isRecepcionista: mockIsRecepcionista });

const JWT_SECRET = 'supersecret';
const token = jwt.sign({ id: 1, role: 'recepcionista', username: 'recep' }, JWT_SECRET);

describe('Reservation API - Fluxos de sucesso', () => {
  let guestId;
  it('deve cadastrar hóspede com sucesso', async () => {
    const res = await request(appMock)
      .post('/guests')
      .send({ name: 'João Teste', document: '12345678', email: 'joao@teste.com', phone: '9999-9999' });
    expect([201, 200, 409]).toContain(res.status); // 201 se novo, 409 se já existe
    guestId = res.body.id;
  });

  it('deve consultar ocupação de quartos em uma data', async () => {
    const res = await request(appMock)
      .get('/rooms/occupancy?date=2025-09-15');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve consultar relatório de receita (mesmo sem reservas pagas)', async () => {
    const res = await request(appMock)
      .get('/reports/revenue?start=2025-09-01&end=2025-09-30');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('count');
  });

  it('deve alterar amount de uma reserva inexistente (retorna 404)', async () => {
    const res = await request(appMock)
      .patch('/reservations/999/amount')
      .send({ amount: 100 });
    expect([404, 400]).toContain(res.status);
  });
});
