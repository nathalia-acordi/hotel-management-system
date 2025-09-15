import request from 'supertest';
import app from '../src/index.mjs';

// Testes de regras de negócio do Payment Service
// - Cobrem validações, aplicação de desconto (Strategy), e regras críticas
// - Garante que todos os fluxos de negócio estejam protegidos

describe('Payment Business Rules', () => {
  it('deve criar um pagamento válido (cartao, sem desconto)', async () => {
    // Testa fluxo de sucesso sem desconto (cartão)
    const res = await request(app)
      .post('/payments')
      .send({ reservationId: 1, amount: 100, method: 'cartao' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.method).toBe('cartao');
    expect(res.body.status).toBe('pendente');
    expect(res.body.amount).toBe(100); // Sem desconto
  });

  it('deve aplicar desconto de 5% para pagamentos via pix', async () => {
    // Testa aplicação do Strategy para PIX
    const res = await request(app)
      .post('/payments')
      .send({ reservationId: 2, amount: 200, method: 'pix', status: 'pago' });
    expect(res.status).toBe(201);
    expect(res.body.method).toBe('pix');
    expect(res.body.status).toBe('pago');
    expect(res.body.amount).toBeCloseTo(190, 1); // 200 * 0.95
  });

  it('deve aplicar desconto de 3% para pagamentos em dinheiro', async () => {
    // Testa aplicação do Strategy para dinheiro
    const res = await request(app)
      .post('/payments')
      .send({ reservationId: 3, amount: 300, method: 'dinheiro', status: 'pago' });
    expect(res.status).toBe(201);
    expect(res.body.method).toBe('dinheiro');
    expect(res.body.status).toBe('pago');
    expect(res.body.amount).toBeCloseTo(291, 1); // 300 * 0.97
  });

  it('deve rejeitar pagamento com método inválido', async () => {
    // Testa validação de método de pagamento
    const res = await request(app)
      .post('/payments')
      .send({ reservationId: 2, amount: 100, method: 'bitcoin' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar pagamento sem campos obrigatórios', async () => {
    // Testa validação de campos obrigatórios
    const res = await request(app)
      .post('/payments')
      .send({ amount: 100 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve listar pagamentos criados', async () => {
    // Testa listagem de pagamentos
    await request(app)
      .post('/payments')
      .send({ reservationId: 3, amount: 200, method: 'pix' });
    const res = await request(app).get('/payments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });


  it('deve rejeitar valor negativo ou zero', async () => {
    // Testa validação de valor do pagamento
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
    // Testa validação de reservationId
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
    // Testa regra de negócio: não pode haver duplicidade
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
