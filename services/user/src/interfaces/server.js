






import dotenv from 'dotenv';
dotenv.config();


import express from 'express';
import { connectToDatabase, mongoReady, getLastMongoError } from './database.js';
import { getSecretSource } from './config/secrets.js';
import { configureRoutes } from './routes.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  
  app.use((req, res, next) => {
    try {
      console.log('[USER][INCOMING]', req.method, req.url, 'Content-Length:', req.headers['content-length']);
      req.on('aborted', () => console.warn('[USER] request aborted by client'));
      req.on('close', () => console.log('[USER] request close event'));
    } catch (err) {
      console.error('[USER] error in debug middleware', err && err.message);
    }
    next();
  });

  app.use(express.json());

  configureRoutes(app);

  
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  
  app.get('/health', (req, res) => {
    const mongo = mongoReady();
    const body = { status: mongo ? 'ok' : 'degradado', service: 'user', mongo, rabbitmq: Boolean(process.env.RABBITMQ_URL), uptime: process.uptime() };
    if (process.env.NODE_ENV !== 'production') {
      body.secrets = {
        mongo: getSecretSource('MONGODB_URI') || 'none',
        jwt: getSecretSource('JWT_SECRET', 'JWT_SECRET_FILE') || 'none',
      };
      if (!mongo) body.mongoErro = getLastMongoError?.();
    }
    res.status(mongo ? 200 : 503).json(body);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  connectToDatabase(); 
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`User Service listening on port ${PORT}`);
  });
}
