import request from 'supertest';
import app from '../src/index.mjs';

describe('Room Business Rules', () => {
  it('deve criar um quarto válido', async () => {
    const res = await request(app)
      .post('/rooms')
      .send({ number: 101, type: 'single', price: 200 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.number).toBe(101);
  });

  it('deve rejeitar criação de quarto sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/rooms')
      .send({ type: 'double' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve listar quartos criados', async () => {
    await request(app)
      .post('/rooms')
      .send({ number: 102, type: 'double', price: 300 });
    const res = await request(app).get('/rooms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('deve rejeitar número de quarto duplicado', async () => {
    await request(app)
      .post('/rooms')
      .send({ number: 200, type: 'single', price: 150 });
    const res = await request(app)
      .post('/rooms')
      .send({ number: 200, type: 'double', price: 180 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar preço negativo ou zero', async () => {
    let res = await request(app)
      .post('/rooms')
      .send({ number: 201, type: 'single', price: -50 });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/rooms')
      .send({ number: 202, type: 'double', price: 0 });
    expect(res.status).toBe(400);
  });

  it('deve rejeitar tipo de quarto inválido', async () => {
    const res = await request(app)
      .post('/rooms')
      .send({ number: 203, type: 'invalid', price: 100 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar número de quarto negativo ou zero', async () => {
    let res = await request(app)
      .post('/rooms')
      .send({ number: -1, type: 'single', price: 100 });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/rooms')
      .send({ number: 0, type: 'double', price: 100 });
    expect(res.status).toBe(400);
  });
});
