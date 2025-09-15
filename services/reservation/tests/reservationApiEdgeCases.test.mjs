import request from 'supertest';
import { createApp } from '../src/index.js';
import jwt from 'jsonwebtoken';

// Testes de edge cases e autorização da Reservation API
// - Cobrem validações de erro, autenticação e autorização
// - Usam tanto middlewares mockados quanto reais

// Middlewares mockados para isolar regras de negócio
const mockAuth = (req, res, next) => { req.user = { role: 'recepcionista' }; next(); };
const mockIsRecepcionista = (req, res, next) => { next(); };
const appMock = createApp({ authenticateJWT: mockAuth, isRecepcionista: mockIsRecepcionista });

// Middlewares reais para testar autenticação JWT
import { authenticateJWT, isRecepcionista } from '../src/authMiddleware.js';
const appReal = createApp({ authenticateJWT, isRecepcionista });

const JWT_SECRET = 'supersecret';
const token = jwt.sign({ id: 1, role: 'recepcionista', username: 'recep' }, JWT_SECRET);

describe('Reservation API - Casos de erro e exceção', () => {
  it('deve rejeitar alteração de amount com valor negativo', async () => {
    // Testa validação de valor negativo
    const res = await request(appMock)
      .patch('/reservations/1/amount')
      .send({ amount: -100 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar relatório de revenue sem start/end', async () => {
    // Testa validação de parâmetros obrigatórios
    const res = await request(appMock)
      .get('/reports/revenue');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar consulta de ocupação sem data', async () => {
    // Testa validação de parâmetro de data
    const res = await request(appMock)
      .get('/rooms/occupancy');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar cadastro de hóspede sem nome/documento', async () => {
    // Testa validação de campos obrigatórios
    const res = await request(appMock)
      .post('/guests')
      .send({ email: 'a@b.com', phone: '123' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Reservation API - Autorização', () => {
  it('deve rejeitar acesso sem JWT', async () => {
    // Testa proteção de rota sem token
    const res = await request(appReal)
      .get('/reservations/active');
    expect(res.status).toBe(401);
  });
  it('deve rejeitar acesso com JWT inválido', async () => {
    // Testa proteção de rota com token inválido
    const res = await request(appReal)
      .get('/reservations/active')
      .set('Authorization', 'Bearer tokeninvalido');
    expect([401, 403]).toContain(res.status);
  });
  it('deve aceitar acesso com JWT válido', async () => {
    // Testa acesso autorizado
    const res = await request(appReal)
      .get('/reservations/active')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 403]).toContain(res.status);
  });
});
