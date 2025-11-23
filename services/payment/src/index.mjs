import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import mongoose from 'mongoose';
import { MongoPaymentRepository } from './infrastructure/MongoPaymentRepository.js';
import { PaymentService } from './application/PaymentService.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { createApp } from './interfaces/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mongoUri = process.env.PAYMENT_MONGODB_URI || process.env.MONGODB_URI;

// Export a top-level identifier for the app so tests can import it. The
// actual value is assigned below depending on `NODE_ENV`. Exports must be
// static/top-level in ESM, so we avoid `export` statements inside blocks.
let exportedApp = undefined;

if (process.env.NODE_ENV === 'test') {
  class InMemoryPaymentRepository {
    constructor() {
      this.items = [];
      this._id = 1;
    }
    async findByReservationAndMethod(reservationId, method) {
      return this.items.find(p => p.reservationId === reservationId && p.method === method) || null;
    }
    async add(payment) {
      payment.id = this._id++;
      this.items.push(payment);
      return payment;
    }
    async getAll() {
      return this.items;
    }
  }

  const repo = new InMemoryPaymentRepository();
  const service = new PaymentService(repo);
  const app = createApp(service);
  // expose swagger docs route in tests too (reads local swagger.yaml)
  try {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(YAML.load(path.join(__dirname, 'swagger.yaml'))));
  } catch (e) {
    // ignore swagger attach errors in test environment
  }

  exportedApp = app;

} else {
  if (!mongoUri) {
    console.error('[PAYMENT] PAYMENT_MONGODB_URI não definido.');
    process.exit(1);
  }

  async function startServer() {
    try {
      await mongoose.connect(mongoUri);
      console.log('[PAYMENT] Conectado ao MongoDB Atlas');
      const repo = new MongoPaymentRepository();
      const service = new PaymentService(repo);
      const app = createApp(service);
      app.use('/docs', swaggerUi.serve, swaggerUi.setup(YAML.load(path.join(__dirname, 'swagger.yaml'))));

      const PORT = 3003;
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Payment Service running on port ${PORT}`);
        console.log(`Swagger UI disponível em http://localhost:${PORT}/docs`);
      });
    } catch (err) {
      console.error('[PAYMENT] Falha ao conectar ao MongoDB Atlas:', err.message);
      process.exit(1);
    }
  }

  startServer();
}
// export top-level identifier (may be undefined in non-test runtime)
export default exportedApp;
