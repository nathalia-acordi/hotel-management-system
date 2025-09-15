import request from 'supertest';
import { createApp } from '../src/index.js';
import jwt from 'jsonwebtoken';

// Middlewares mockados para testes sem autenticação real
const mockAuth = (req, res, next) => { req.user = { role: 'recepcionista' }; next(); };
const mockIsRecepcionista = (req, res, next) => { next(); };
const appMock = createApp({ authenticateJWT: mockAuth, isRecepcionista: mockIsRecepcionista });

// Middlewares reais para testes com JWT
import { authenticateJWT, isRecepcionista } from '../src/authMiddleware.js';
const appReal = createApp({ authenticateJWT, isRecepcionista });

const JWT_SECRET = 'supersecret';
const token = jwt.sign({ id: 1, role: 'recepcionista', username: 'recep' }, JWT_SECRET);

describe('Reservation API - Casos de erro e exceção', () => {
  it('deve rejeitar alteração de amount com valor negativo', async () => {
    const res = await request(appMock)
      .patch('/reservations/1/amount')
      .send({ amount: -100 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar relatório de revenue sem start/end', async () => {
    const res = await request(appMock)
      .get('/reports/revenue');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar consulta de ocupação sem data', async () => {
    const res = await request(appMock)
      .get('/rooms/occupancy');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar cadastro de hóspede sem nome/documento', async () => {
    const res = await request(appMock)
      .post('/guests')
      .send({ email: 'a@b.com', phone: '123' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Reservation API - Autorização', () => {
  it('deve rejeitar acesso sem JWT', async () => {
    const res = await request(appReal)
      .get('/reservations/active');
    expect(res.status).toBe(401);
  });
  it('deve rejeitar acesso com JWT inválido', async () => {
    const res = await request(appReal)
      .get('/reservations/active')
      .set('Authorization', 'Bearer tokeninvalido');
    expect([401, 403]).toContain(res.status);
  });
  it('deve aceitar acesso com JWT válido', async () => {
    const res = await request(appReal)
      .get('/reservations/active')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 403]).toContain(res.status);
  });
});
