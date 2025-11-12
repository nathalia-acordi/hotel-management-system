// index.js - Entry point do Reservation Service
// - Aplica Clean Architecture: separa camadas de interface, domínio e infraestrutura
// - Permite injeção de middlewares para facilitar testes (mock de autenticação, etc)
// - Integração com RabbitMQ para eventos de usuário criado
// - Conexão com MongoDB para persistência de reservas

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import reservationController from './interfaces/reservationController.js';
import { MongoReservationRepository } from './infrastructure/MongoReservationRepository.js';
import { startUserCreatedConsumer } from './rabbitmqConsumer.js';

dotenv.config();

// Configuração do Mongoose
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
      console.error('[RESERVATION] MONGODB_URI is required in production. Aborting startup.');
      process.exit(1);
    } else {
      console.error('[RESERVATION] MONGODB_URI missing - service will start but MongoDB is not connected');
      return null;
    }
  }
  let lastErr;
  for (let i = 1; i <= 10; i++) {
    try {
      await tryConnectOnce();
      console.log('[RESERVATION] Conectado ao MongoDB');
      global.__rabbitmqConnected = true;
      return;
    } catch (e) {
      lastErr = e;
      lastMongoErrorMsg = e?.message || String(e);
      console.error(`[RESERVATION] Tentativa ${i}/10 falhou ao conectar no Mongo:`, lastMongoErrorMsg);
      const base = Math.min(2 ** (i - 1), 60);
      const jitter = Math.random();
      const delaySec = base + jitter;
      await new Promise(r => setTimeout(r, delaySec * 1000));
    }
  }
  lastMongoErrorMsg = lastErr?.message || String(lastErr);
  console.error('[RESERVATION] Falha inicial após várias tentativas. Continuará tentando em background a cada 30s.');
  global.__rabbitmqConnected = false;
  (async function loop(){
    while (mongoose.connection?.readyState !== 1) {
      try {
        await tryConnectOnce();
        console.log('[RESERVATION] Conectado ao MongoDB (background)');
        global.__rabbitmqConnected = true;
        break;
      } catch (e) {
        lastMongoErrorMsg = e?.message || String(e);
        console.error('[RESERVATION] Retry background falhou:', lastMongoErrorMsg);
        await new Promise(r => setTimeout(r, 30000));
      }
    }
  })();
  return null;
}

function mongoReady() {
  return mongoose.connection?.readyState === 1;
}

// Função factory para criar o app com middlewares injetáveis
export function createApp(middlewares = {}) {
  const app = express();
  app.use(express.json());
  
  // Health check
  app.get('/', (req, res) => {
    res.send('Reservation Service running');
  });
  
  app.get('/health', async (req, res) => {
    const mongo = mongoReady();
    let rabbitStatus = 'unknown';
    if (global.__rabbitmqConnected === true) rabbitStatus = 'connected';
    if (global.__rabbitmqConnected === false) rabbitStatus = 'disconnected';
    
    const body = {
      status: mongo ? 'ok' : 'degradado',
      service: 'reservation',
      mongo,
      rabbitmq: rabbitStatus,
      uptime: process.uptime()
    };
    
    // Em não-produção, expõe informações de debug
    if (process.env.NODE_ENV !== 'production') {
      if (!mongo) body.mongoErro = lastMongoErrorMsg;
    }
    
    res.status(mongo ? 200 : 503).json(body);
  });
  
  // Injeção de dependência do repositório (DIP) - USA MONGO
  const reservationRepository = new MongoReservationRepository();
  global.__reservationRepository__ = reservationRepository;
  
  app.use('/', reservationController(middlewares));
  return app;
}

// Inicialização padrão (exceto em testes)
if (process.env.NODE_ENV !== 'test') {
  connectMongoIfNeeded().then(() => {
    const app = createApp();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Reservation Service running on port ${PORT}`);
      // Inicia consumer RabbitMQ para eventos de usuário criado
      startUserCreatedConsumer();
    });
  });
}