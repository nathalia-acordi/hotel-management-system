import request from 'supertest';
import express from 'express';




const app = express();
app.get('/', (req, res) => {
  res.send('Payment Service running');
});

describe('Payment Service health check', () => {
  it('GET / deve retornar status 200 e mensagem', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Payment Service running');
  });
});
