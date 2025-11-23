import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { setupProxies } from './proxyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());

app.use(morgan(':method :url :status :response-time ms', {
  skip: (req) => req.path === '/health'
}));


app.get('/health', async (req, res) => {
  try {
    
    res.status(200).json({
      status: 'ok',
      service: 'gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      erro: 'Erro ao verificar saúde do sistema'
    });
  }
});

app.use((req, res, next) => {
  console.log(`[GATEWAY][GLOBAL] ${req.method} ${req.originalUrl}`);
  next();
});

setupProxies(app);

app.use(express.json());

app.use((err, req, res, next) => {
  console.error('[GATEWAY] Erro:', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});


app.use((req, res) => {
  console.log('[GATEWAY][404] Rota não encontrada:', req.method, req.originalUrl);
  res.status(404).json({ erro: 'Rota não encontrada' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[GATEWAY] Serviço iniciado na porta ${PORT}`);
  });
}

export default app;
