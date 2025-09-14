import request from 'supertest';
import express from 'express';

// Simula o app do Room Service
const app = express();
app.get('/', (req, res) => {
  res.send('Room Service running');
});

describe('Room Service health check', () => {
  it('GET / deve retornar status 200 e mensagem', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Room Service running');
  });
});
