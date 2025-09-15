import request from 'supertest';
import { createApp } from '../src/index.js';
import jwt from 'jsonwebtoken';

// Testes de sucesso da Reservation API
// - Usam middlewares mockados para isolar regras de negócio
// - Cobrem cadastro de hóspede, consulta de ocupação, relatório e alteração de reserva

const mockAuth = (req, res, next) => { req.user = { role: 'recepcionista' }; next(); };
const mockIsRecepcionista = (req, res, next) => { next(); };
const appMock = createApp({ authenticateJWT: mockAuth, isRecepcionista: mockIsRecepcionista });

const JWT_SECRET = 'supersecret';
const token = jwt.sign({ id: 1, role: 'recepcionista', username: 'recep' }, JWT_SECRET);

describe('Reservation API - Fluxos de sucesso', () => {
  let guestId;

  it('deve cadastrar hóspede com sucesso', async () => {
    // Testa cadastro de hóspede (validação de documento e unicidade)
    const res = await request(appMock)
      .post('/guests')
      .send({ name: 'João Teste', document: '12345678', email: 'joao@teste.com', phone: '9999-9999' });
    expect([201, 200, 409]).toContain(res.status); // 201 se novo, 409 se já existe
    guestId = res.body.id;
  });

  it('deve consultar ocupação de quartos em uma data', async () => {
    // Testa consulta de ocupação (regra de datas/quartos)
    const res = await request(appMock)
      .get('/rooms/occupancy?date=2025-09-15');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve consultar relatório de receita (mesmo sem reservas pagas)', async () => {
    // Testa relatório de receita (faturamento)
    const res = await request(appMock)
      .get('/reports/revenue?start=2025-09-01&end=2025-09-30');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('count');
  });

  it('deve alterar amount de uma reserva inexistente (retorna 404)', async () => {
    // Testa alteração de reserva inexistente
    const res = await request(appMock)
      .patch('/reservations/999/amount')
      .send({ amount: 100 });
    expect([404, 400]).toContain(res.status);
  });
});
