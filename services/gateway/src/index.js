import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupProxies } from './proxyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Configuração básica
app.use(cors());
app.use(express.json());

// Logger customizado para não expor dados sensíveis
app.use(morgan(':method :url :status :response-time ms', {
  skip: (req) => req.path === '/health'
}));

// Health check mais completo
app.get('/health', async (req, res) => {
  try {
    // TODO: Implementar verificação básica de conectividade com serviços
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

// Configura rotas proxy
setupProxies(app);

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('[GATEWAY] Erro:', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[GATEWAY] Serviço iniciado na porta ${PORT}`);
  });
}

export default app;
