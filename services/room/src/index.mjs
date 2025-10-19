// Entry point do Room Service
// - Permite injeção de middlewares de autenticação/autorização para facilitar testes e customização
// - Usa RoomFactory (GoF) para criar instâncias de quartos
// - Implementa regras de negócio de validação de quartos

import express from 'express';
import { authenticateJWT as defaultAuthenticateJWT, isAdmin as defaultIsAdmin, authorizeRoles as defaultAuthorizeRoles } from './authMiddleware.js';
import { RoomService } from './application/RoomService.js';
import { MongoRoomRepository } from './infrastructure/MongoRoomRepository.js';
import mongoose from 'mongoose';
import { getSecretSource } from './interfaces/config/secrets.js';
import dotenv from 'dotenv';
import { createRoomSchema, updateRoomSchema, patchStatusSchema } from './interfaces/dto/roomSchemas.js';
import fs from 'fs';

dotenv.config();

mongoose.set('strictQuery', true);

const mongoUri = process.env.MONGODB_URI || '';
const baseMongoOpts = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  autoIndex: process.env.NODE_ENV !== 'production',
};

let lastMongoErrorMsg = null;

async function tryConnectOnce() {
  const opts = { ...baseMongoOpts };
  if (process.env.MONGO_FORCE_IPV4 === '1') opts.family = 4;
  await mongoose.connect(mongoUri, opts);
}

async function connectMongoIfNeeded() {
  if (process.env.NODE_ENV === 'test') return;
  if (!mongoUri) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[ROOM SERVICE] MONGODB_URI is required in production. Aborting startup.');
      process.exit(1);
    } else {
      console.error('[ROOM SERVICE] MONGODB_URI missing - service will start but MongoDB is not connected');
      return null;
    }
  }
  let lastErr;
  for (let i = 1; i <= 10; i++) {
    try {
      await tryConnectOnce();
      console.log('[ROOM SERVICE] Conectado ao MongoDB');
      return;
    } catch (e) {
      lastErr = e;
      lastMongoErrorMsg = e?.message || String(e);
      console.error(`[ROOM SERVICE] Tentativa ${i}/10 falhou ao conectar no Mongo:`, lastMongoErrorMsg);
      const base = Math.min(2 ** (i - 1), 60);
      const jitter = Math.random();
      const delaySec = base + jitter;
      await new Promise(r => setTimeout(r, delaySec * 1000));
    }
  }
  lastMongoErrorMsg = lastErr?.message || String(lastErr);
  console.error('[ROOM SERVICE] Falha inicial após várias tentativas. Continuará tentando em background a cada 30s.');
  (async function loop(){
    while (mongoose.connection?.readyState !== 1) {
      try {
        await tryConnectOnce();
        console.log('[ROOM SERVICE] Conectado ao MongoDB (background)');
        break;
      } catch (e) {
        lastMongoErrorMsg = e?.message || String(e);
        console.error('[ROOM SERVICE] Retry background falhou:', lastMongoErrorMsg);
        await new Promise(r => setTimeout(r, 30000));
      }
    }
  })();
  return null;
}

function mongoReady() {
  return mongoose.connection?.readyState === 1;
}

export function createApp({ authenticateJWT = defaultAuthenticateJWT, isAdmin = defaultIsAdmin, authorizeRoles = defaultAuthorizeRoles } = {}) {
  const app = express();
  app.use(express.json());

  const roomRepository = new MongoRoomRepository();
  const roomService = new RoomService(roomRepository);

  // Middleware global de tratamento de erros
  app.use((err, req, res, next) => {
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    res.status(status).json({ error: err.message || 'Erro interno' });
  });

  // Health check endpoint
  app.get('/', (req, res) => { res.send('Room Service running'); });
  app.get('/health', (req, res) => {
    const mongo = mongoReady();
    const body = { status: mongo ? 'ok' : 'degradado', service: 'room', mongo, rabbitmq: Boolean(process.env.RABBITMQ_URL), uptime: process.uptime() };
  // Em não-produção, expõe de onde os segredos vêm para depuração
    if (process.env.NODE_ENV !== 'production') {
      body.secrets = {
        mongo: getSecretSource('MONGODB_URI') || 'none',
        jwt: getSecretSource('JWT_SECRET', 'JWT_SECRET_FILE') || 'none',
      };
      if (!mongo) body.mongoErro = lastMongoErrorMsg;
    }
    res.status(mongo ? 200 : 503).json(body);
  });

  // Criação de quarto
  app.post('/rooms', authenticateJWT, authorizeRoles('admin', 'receptionist'), async (req, res) => {
    try {
      const { error, value } = createRoomSchema.validate(req.body, { abortEarly: false });
      if (error) return res.status(400).json({ error: 'Payload inválido', details: error.details.map(d => d.message) });
      const room = await roomService.createRoom(value);
      return res.status(201).json(room);
    } catch (err) {
      const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
      return res.status(status).json({ error: err.message });
    }
  });

  // Listar quartos (requer autenticação)
  app.get('/rooms', authenticateJWT, async (req, res, next) => {
    try {
      const rooms = await roomService.listRooms();
      res.json(rooms);
    } catch (error) {
      next(error);
    }
  });

  // Obter quarto por ID (requer autenticação)
  app.get('/rooms/:id', authenticateJWT, async (req, res, next) => {
    try {
      const room = await roomRepository.findById(req.params.id);
      if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });
      res.json(room);
    } catch (error) {
      next(error);
    }
  });

  // Atualizar quarto
  app.put('/rooms/:id', authenticateJWT, isAdmin, async (req, res, next) => {
    try {
      const { error, value } = updateRoomSchema.validate(req.body, { abortEarly: false });
      if (error) return res.status(400).json({ error: 'Payload inválido', details: error.details.map(d => d.message) });
      const updatedRoom = await roomService.updateRoom(req.params.id, value);
      res.json(updatedRoom);
    } catch (error) {
      next(error);
    }
  });

  // Remover quarto
  app.delete('/rooms/:id', authenticateJWT, isAdmin, async (req, res, next) => {
    try {
      const deletedRoom = await roomService.deleteRoom(req.params.id);
      res.json(deletedRoom);
    } catch (error) {
      next(error);
    }
  });

  // Atualizar status do quarto
  app.patch('/rooms/:id/status', authenticateJWT, authorizeRoles('admin', 'receptionist'), async (req, res) => {
    try {
      const { id } = req.params;
      const { error, value } = patchStatusSchema.validate(req.body, { abortEarly: false });
      if (error) return res.status(400).json({ error: 'Payload inválido', details: error.details.map(d => d.message) });
      const { status } = value;
      const updatedRoom = await roomService.updateRoomStatus(id, status);
      return res.status(200).json(updatedRoom);
    } catch (err) {
      const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
      return res.status(status).json({ error: err.message });
    }
  });

  // Marcar quarto como em manutenção
  app.patch('/rooms/:id/maintenance', authenticateJWT, authorizeRoles('admin', 'receptionist'), async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRoom = await roomService.setRoomUnderMaintenance(id);
      return res.status(200).json(updatedRoom);
    } catch (err) {
      const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
      return res.status(status).json({ error: err.message });
    }
  });

  // Marcar quarto como disponível
  app.patch('/rooms/:id/available', authenticateJWT, authorizeRoles('admin', 'receptionist'), async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRoom = await roomService.setRoomAvailable(id);
      return res.status(200).json(updatedRoom);
    } catch (err) {
      const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
      return res.status(status).json({ error: err.message });
    }
  });

  return app;
}

const app = createApp();

const PORT = process.env.PORT || 3004;
if (process.env.NODE_ENV !== 'test') {
  connectMongoIfNeeded().then(() => {
    app.listen(PORT, () => {
      console.log(`Room Service running on port ${PORT}`);
    });
  });
}

export default app;
