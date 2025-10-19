import request from 'supertest';
import { createApp } from '../src/interfaces/server.js';

describe('Auth Service - Health Check', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('GET / deve retornar status 200 e mensagem', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Auth Service running');
  });

  it('GET /health deve retornar status 200 e json', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'auth');
  });
});
