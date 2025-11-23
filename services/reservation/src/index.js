





import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import reservationController from './interfaces/reservationController.js';
import { MongoReservationRepository } from './infrastructure/MongoReservationRepository.js';
import { startUserCreatedConsumer } from './rabbitmqConsumer.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

mongoose.set('strictQuery', true);
const mongoUri = process.env.RESERVATION_MONGODB_URI || process.env.MONGODB_URI || '';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!mongoUri) {
  console.error('[RESERVATION] MONGODB_URI is required. Aborting startup.');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('[RESERVATION] Conectado ao MongoDB');
  const app = express();
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

  
  const reservationRepository = new MongoReservationRepository();
  global.__reservationRepository__ = reservationRepository;
  app.use('/', reservationController({}));

  
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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