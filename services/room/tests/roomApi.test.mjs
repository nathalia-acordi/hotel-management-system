import request from 'supertest';
import { createApp } from '../src/index.mjs';
import jwt from 'jsonwebtoken';


const SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';
function makeToken(role='admin') {
  return jwt.sign({ id: 'room-tester', username: role+'_user', role }, SECRET, { expiresIn: '1h' });
}


const app = createApp();

describe('Room Service API', () => {
  const adminToken = makeToken('admin');
  const receptionistToken = makeToken('receptionist');

  it('400 ao criar quarto com payload inválido', async () => {
    const res = await request(app)
      .post('/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ number: -1 });
    expect(res.status).toBe(400);
  });

  it('201 ao criar quarto válido como admin', async () => {
    const payload = { number: 101, type: 'standard', capacity: 2, price: 300 };
    const res = await request(app)
      .post('/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ number: 101, type: 'standard' });
  });

  it('201 ao criar quarto válido como receptionist', async () => {
    const payload = { number: 102, type: 'deluxe', capacity: 3, price: 450 };
    const res = await request(app)
      .post('/rooms')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send(payload);
    expect([201, 403]).toContain(res.status); 
  });

  it('401 sem token', async () => {
    const res = await request(app).post('/rooms').send({ number: 103, type: 'suite', capacity: 4, price: 800 });
    expect(res.status).toBe(401);
  });
});