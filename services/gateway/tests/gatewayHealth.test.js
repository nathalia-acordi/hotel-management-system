import request from 'supertest';
import app from '../src/index.js';

describe('Gateway Health Check', () => {
  it('deve responder 200 no /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

// Exemplo de estrutura para autenticação (ajuste conforme seu middleware)
describe('Gateway Auth Middleware', () => {
  it('deve bloquear rota protegida sem token', async () => {
    const res = await request(app).get('/protegido');
    expect(res.status).toBe(401);
  });
});
