import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { connectToDatabase } from './database.js';
import { configureRoutes } from './routes.js';

export function createApp() {
  const app = express();
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    next();
  });

  configureRoutes(app);

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  connectToDatabase(); // Conecta ao MongoDB
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`User Service listening on port ${PORT}`);
  });
}
