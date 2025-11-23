






import mongoose from 'mongoose';
import fs from 'fs';

mongoose.set('strictQuery', true);

const uri = process.env.MONGODB_URI || '';
const baseOpts = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  autoIndex: process.env.NODE_ENV !== 'production',
};

let lastMongoErrorMsg = null;

async function tryConnectOnce() {
  const opts = { ...baseOpts };
  if (process.env.MONGO_FORCE_IPV4 === '1') opts.family = 4;
  await mongoose.connect(uri, opts);
}

async function connectWithBackoff(attempts = 10) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      await tryConnectOnce();
      console.log('[USER] Conectado ao MongoDB');
      return true;
    } catch (e) {
      lastErr = e;
      lastMongoErrorMsg = e?.message || String(e);
      console.error(`[USER] Tentativa ${i}/${attempts} falhou ao conectar no Mongo:`, lastMongoErrorMsg);
      const base = Math.min(2 ** (i - 1), 60);
      const jitter = Math.random();
      const delaySec = base + jitter;
      await new Promise(r => setTimeout(r, delaySec * 1000));
    }
  }
  return false;
}

export async function connectToDatabase() {
  if (process.env.NODE_ENV === 'test') return; 
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[USER] MONGODB_URI is required in production. Aborting startup.');
      process.exit(1);
    } else {
      console.error('[USER] MONGODB_URI missing - service will start but MongoDB is not connected');
      return null;
    }
  }
  const ok = await connectWithBackoff(10);
  if (!ok) {
    console.error('[USER] Falha inicial após várias tentativas. Continuará tentando em background a cada 30s.');
  
    (async function loop() {
      while (mongoose.connection?.readyState !== 1) {
        try {
          await tryConnectOnce();
          console.log('[USER] Conectado ao MongoDB (background)');
          break;
        } catch (e) {
          lastMongoErrorMsg = e?.message || String(e);
          console.error('[USER] Retry background falhou:', lastMongoErrorMsg);
          await new Promise(r => setTimeout(r, 30000));
        }
      }
    })();
  }
  return mongoose.connection;
}

export function mongoReady() {
  return mongoose.connection?.readyState === 1;
}

export function getLastMongoError() {
  return lastMongoErrorMsg;
}