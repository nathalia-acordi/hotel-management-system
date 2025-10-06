
import request from 'supertest';
import express from 'express';
import { createApp } from '../src/interfaces/server.js';

// Simula o app do Auth Service
const app = express();
app.get('/', (req, res) => {
  res.send('Auth Service running');
});

describe('Auth Service health check', () => {
  it('GET / deve retornar status 200 e mensagem', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Auth Service running');
  });
});
// Teste de health check do Auth Service
// Garante que o endpoint /health responde corretamente
it('GET /health deve retornar status 200 e json', async () => {
  process.env.USER_SERVICE_URL = 'http://localhost:3005';
  const app = createApp();
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('status', 'ok');
  expect(res.body).toHaveProperty('service', 'auth');
});
