import request from 'supertest';
import { createApp } from '../src/index.mjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';


const mockAuth = (req, res, next) => { req.user = { role: 'admin' }; next(); };
const appMock = createApp({ authenticateJWT: mockAuth });

describe('Room Status and Maintenance', () => {
  let roomId;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('[Test Setup] Criando quarto para testes...');
    const res = await request(appMock)
      .post('/rooms')
  .send({ number: 101, type: 'standard', price: 200, capacity: 2 });
    console.log('[Test Setup] Resposta da criação do quarto:', res.body);
    roomId = res.body.id;
    console.log('[Test Setup] ID do quarto criado:', roomId);

    
    const roomInDb = await mongoose.connection.db.collection('rooms').findOne({ _id: new mongoose.Types.ObjectId(roomId) });
    console.log('[Test Setup] Quarto persistido no banco:', roomInDb);
  });

  afterAll(async () => {
  
    if (mongoose.connection.readyState) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) await mongoServer.stop();
  });

  it('should update room status to occupied', async () => {
    const res = await request(appMock)
      .patch(`/rooms/${roomId}/status`)
      .send({ status: 'occupied' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('occupied');
  });

  it('should mark room as under maintenance', async () => {
    const res = await request(appMock)
      .patch(`/rooms/${roomId}/maintenance`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('maintenance');
  });

  it('should mark room as available', async () => {
    const res = await request(appMock)
      .patch(`/rooms/${roomId}/available`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('free');
  });

  it('should reject invalid status updates', async () => {
    const res = await request(appMock)
      .patch(`/rooms/${roomId}/status`)
      .send({ status: 'invalid-status' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent room', async () => {
  const nonExistentId = new mongoose.Types.ObjectId(); 
    const res = await request(appMock)
      .patch(`/rooms/${nonExistentId}/status`)
      .send({ status: 'free' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});