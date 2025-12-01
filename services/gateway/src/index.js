import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { setupProxies } from './proxyRoutes.js';
import { attachMetrics } from './monitoring/metrics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());

try { attachMetrics(app); } catch (e) { console.warn('[GATEWAY] metrics attach failed', e && e.message); }

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

// setupProxies may perform async startup of local test stubs when NODE_ENV==='test'.
await setupProxies(app);

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
} else if (!process.env.JEST_WORKER_ID) {
  // Only start a real HTTP listener in the parent/test-runner process (not in
  // jest worker processes). The test runner (globalSetup) spawns a detached
  // process to host the gateway; this block will run in that process and start
  // the listener. Worker processes that import the app for supertest must not
  // start another listener (that would cause EADDRINUSE).
  try {
    const server = app.listen(PORT, () => {
      console.log(`[GATEWAY] Serviço (test) iniciado na porta ${PORT}`);
    });
    try { server.unref(); } catch (e) { /* best-effort */ }
    global.__gatewayServer = server;
  } catch (e) {
    console.warn('[GATEWAY] Falha ao iniciar listener de teste:', e && e.message);
  }
} else {
  // In jest worker processes, do not start a network listener; supertest will
  // use the `app` directly.
}

export default app;
