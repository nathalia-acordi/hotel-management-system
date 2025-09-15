import request from 'supertest';
import app from '../src/index.mjs';

describe('Payment Business Rules', () => {
  it('deve criar um pagamento válido', async () => {
    const res = await request(app)
      .post('/payments')
      .send({ reservationId: 1, amount: 100, method: 'cartao' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.method).toBe('cartao');
    expect(res.body.status).toBe('pendente');
  });

  it('deve rejeitar pagamento com método inválido', async () => {
    const res = await request(app)
      .post('/payments')
      .send({ reservationId: 2, amount: 100, method: 'bitcoin' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar pagamento sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/payments')
      .send({ amount: 100 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve listar pagamentos criados', async () => {
    await request(app)
      .post('/payments')
      .send({ reservationId: 3, amount: 200, method: 'pix' });
    const res = await request(app).get('/payments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('deve rejeitar valor negativo ou zero', async () => {
    let res = await request(app)
      .post('/payments')
      .send({ reservationId: 10, amount: -100, method: 'cartao' });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/payments')
      .send({ reservationId: 11, amount: 0, method: 'pix' });
    expect(res.status).toBe(400);
  });

  it('deve rejeitar reservationId negativo, zero ou ausente', async () => {
    let res = await request(app)
      .post('/payments')
      .send({ reservationId: -1, amount: 100, method: 'cartao' });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/payments')
      .send({ reservationId: 0, amount: 100, method: 'pix' });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/payments')
      .send({ amount: 100, method: 'pix' });
    expect(res.status).toBe(400);
  });

  it('deve rejeitar pagamento duplicado para mesma reserva e método', async () => {
    await request(app)
      .post('/payments')
      .send({ reservationId: 20, amount: 100, method: 'cartao' });
    const res = await request(app)
      .post('/payments')
      .send({ reservationId: 20, amount: 100, method: 'cartao' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
