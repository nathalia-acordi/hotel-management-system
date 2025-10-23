import request from 'supertest';
import app from '../src/index.js';

describe('Gateway API', () => {
  it('deve retornar 200 no healthcheck', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('deve retornar 401 em rota protegida sem token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('Não autenticado');
  });

  it('deve retornar 404 para rota inexistente', async () => {
    const res = await request(app).get('/api/naoexiste');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Rota não encontrada');
  });
});