import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import mongoose from 'mongoose';
import { MongoPaymentRepository } from './infrastructure/MongoPaymentRepository.js';
import { PaymentService } from './application/PaymentService.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mongoUri = process.env.PAYMENT_MONGODB_URI || process.env.MONGODB_URI;
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
    const serverModule = await import('./interfaces/server.js');
    const app = serverModule.createApp(service);
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
