





import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import reservationController from './interfaces/reservationController.js';
import { MongoReservationRepository } from './infrastructure/MongoReservationRepository.js';
import { InMemoryReservationRepository } from './infrastructure/InMemoryReservationRepository.js';
import { startUserCreatedConsumer } from './rabbitmqConsumer.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { attachMetrics } from './monitoring/metrics.js';

dotenv.config();

mongoose.set('strictQuery', true);
const mongoUri = process.env.RESERVATION_MONGODB_URI || process.env.MONGODB_URI || '';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp({ authenticateJWT = (req, res, next) => next(), isRecepcionista = () => false } = {}) {
  const app = express();
  try { attachMetrics(app); } catch (e) { console.warn('[RESERVATION] metrics attach failed', e && e.message); }
  app.use(express.json());

  app.get('/', (req, res) => {
    res.send('Reservation Service running');
  });

  app.get('/health', async (req, res) => {
    const mongo = mongoose.connection?.readyState === 1;
    const body = {
      status: mongo ? 'ok' : 'degradado',
      service: 'reservation',
      mongo,
      uptime: process.uptime()
    };
    res.status(mongo ? 200 : 503).json(body);
  });

  // Prefer an injected global repository (tests may set it). In test env default to InMemory repo to avoid Mongo buffering.
  const reservationRepository = global.__reservationRepository__ || (process.env.NODE_ENV === 'test' ? new InMemoryReservationRepository() : new MongoReservationRepository());
  // set global only if not already defined so tests can inject an in-memory repo
  if (!global.__reservationRepository__) global.__reservationRepository__ = reservationRepository;
  app.use('/', reservationController({ authenticateJWT, isRecepcionista }));

  try {
    const swaggerPath = path.join(__dirname, 'swagger.yaml');
    if (fs.existsSync(swaggerPath)) {
      const swaggerDocument = YAML.load(swaggerPath);
      app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } else {
      console.warn('[RESERVATION] swagger.yaml não encontrado, pulando /docs');
    }
  } catch (e) {
    console.warn('[RESERVATION] Falha ao carregar swagger:', e && e.message);
  }

  return app;
}

// Normal startup for non-test environments: connect to DB and start HTTP server
if (process.env.NODE_ENV !== 'test') {
  if (!mongoUri) {
    console.error('[RESERVATION] MONGODB_URI is required. Aborting startup.');
    process.exit(1);
  }

  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('[RESERVATION] Conectado ao MongoDB');
    const app = createApp();
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
      console.log(`Reservation Service running on port ${PORT}`);
      startUserCreatedConsumer();
      console.log(`Swagger UI disponível em http://localhost:${PORT}/docs`);
    });
  }).catch(err => {
    console.error('[RESERVATION] Falha ao conectar ao MongoDB:', err.message);
    process.exit(1);
  });
}