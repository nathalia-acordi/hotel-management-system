import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { connectToDatabase, mongoReady, getLastMongoError } from './database.js';
import { getSecretSource } from './config/secrets.js';
import { configureRoutes } from './routes.js';

export function createApp() {
  const app = express();
  app.use(express.json()); // Substitui bodyParser.json() por express.json()

  app.use((req, res, next) => {
    next();
  });

  configureRoutes(app);

  // Health check endpoint com status do Mongo (pt-BR)
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
  connectToDatabase(); // Conecta ao MongoDB (com retry/backoff)
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`User Service listening on port ${PORT}`);
  });
}
