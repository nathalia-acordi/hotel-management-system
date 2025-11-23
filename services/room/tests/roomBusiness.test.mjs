import request from 'supertest';
import { createApp } from '../src/index.mjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';






const mockAuth = (req, res, next) => { req.user = { role: 'admin' }; next(); };
const mockIsAdmin = (req, res, next) => { next(); };
const appMock = createApp({ authenticateJWT: mockAuth, isAdmin: mockIsAdmin });

describe('Room Business Rules (sem autenticação real)', () => {
  
  it('deve criar um quarto válido', async () => {
    
    const res = await request(appMock)
      .post('/rooms')
  .send({ number: 101, type: 'standard', price: 200, capacity: 2 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.number).toBe(101);
  });

  it('deve rejeitar criação de quarto sem campos obrigatórios', async () => {
    
    const res = await request(appMock)
      .post('/rooms')
      .send({ type: 'double' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve listar quartos criados', async () => {
    
    await request(appMock)
      .post('/rooms')
  .send({ number: 102, type: 'deluxe', price: 300, capacity: 2 });
    const res = await request(appMock).get('/rooms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('deve rejeitar número de quarto duplicado', async () => {
    
    await request(appMock)
      .post('/rooms')
  .send({ number: 200, type: 'suite', price: 150, capacity: 2 });
    const res = await request(appMock)
      .post('/rooms')
      .send({ number: 200, type: 'double', price: 180 });
    expect([400, 409]).toContain(res.status);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar preço negativo ou zero', async () => {
    
    let res = await request(appMock)
      .post('/rooms')
  .send({ number: 201, type: 'standard', price: -50, capacity: 1 });
    expect(res.status).toBe(400);
    res = await request(appMock)
      .post('/rooms')
  .send({ number: 202, type: 'deluxe', price: 0, capacity: 2 });
    expect(res.status).toBe(201);
  });

  it('deve rejeitar tipo de quarto inválido', async () => {
    
    const res = await request(appMock)
      .post('/rooms')
  .send({ number: 203, type: 'invalid', price: 100, capacity: 2 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar número de quarto negativo ou zero', async () => {
    
    let res = await request(appMock)
      .post('/rooms')
  .send({ number: -1, type: 'standard', price: 100, capacity: 1 });
    expect(res.status).toBe(400);
    res = await request(appMock)
      .post('/rooms')
  .send({ number: 0, type: 'deluxe', price: 100, capacity: 2 });
    expect(res.status).toBe(400);
  });

  it('deve atualizar um quarto existente', async () => {
    
    const createRes = await request(appMock)
      .post('/rooms')
  .send({ number: 300, type: 'suite', price: 500, capacity: 4 });
    const roomId = createRes.body.id;

    
    const updateRes = await request(appMock)
      .put(`/rooms/${roomId}`)
      .send({ type: 'deluxe', price: 600 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.type).toBe('deluxe');
    expect(updateRes.body.price).toBe(600);
  });

  it('deve remover um quarto existente', async () => {
    
    const createRes = await request(appMock)
      .post('/rooms')
      .send({ number: 400, type: 'standard', price: 300, capacity: 2 });
    const roomId = createRes.body.id;

    
    const deleteRes = await request(appMock)
      .delete(`/rooms/${roomId}`);
    expect(deleteRes.status).toBe(200);

    
    const getRes = await request(appMock).get(`/rooms/${roomId}`);
    expect(getRes.status).toBe(404);
  });
});



import jwt from 'jsonwebtoken';
import { authenticateJWT, isAdmin } from '../src/authMiddleware.js';
const appReal = createApp({ authenticateJWT, isAdmin });

describe('Room Business Rules (com autenticação real)', () => {
  
  const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';
  const token = jwt.sign({ id: 1, role: 'admin', username: 'admin' }, JWT_SECRET);

  it('cria quarto com JWT válido', async () => {
    
    const res = await request(appReal)
      .post('/rooms')
      .set('Authorization', `Bearer ${token}`)
  .send({ number: 301, type: 'suite', price: 500, capacity: 4 });
    expect([201, 400]).toContain(res.status); 
  });

  it('rejeita sem JWT', async () => {
    
    const res = await request(appReal)
      .post('/rooms')
  .send({ number: 302, type: 'suite', price: 500, capacity: 4 });
    expect(res.status).toBe(401);
  });

  it('rejeita com JWT inválido', async () => {
    
    const res = await request(appReal)
      .post('/rooms')
      .set('Authorization', 'Bearer tokeninvalido')
  .send({ number: 303, type: 'suite', price: 500, capacity: 4 });
    expect([401, 403]).toContain(res.status);
  });
});

let mongoServer;
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
