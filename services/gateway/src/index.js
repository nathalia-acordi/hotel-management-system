import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authenticateJWT } from './authMiddleware.js';
import { setupProxies } from './proxyRoutes.js';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(morgan('dev'));
app.use(express.json());


// Exemplo de rota pública
app.get('/', (req, res) => {
  res.json({ message: 'API Gateway rodando!' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'gateway' });
});

// Exemplo de rota protegida (futuras rotas proxy usarão este middleware)
app.get('/protegido', authenticateJWT, (req, res) => {
  res.json({ message: 'Acesso autorizado!', user: req.user });
});

// Configura as rotas proxy para os microsserviços
setupProxies(app);


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API Gateway rodando na porta ${PORT}`);
  });
}

export default app;
