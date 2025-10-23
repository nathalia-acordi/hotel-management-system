import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateJWT, authorizeRoles } from './authMiddleware.js';

// URLs dos microsserviços via variáveis de ambiente ou fallback para compose
const services = {
  user: process.env.USER_URL || 'http://user:3000',
  auth: process.env.AUTH_URL || 'http://auth:3001',
  reservation: process.env.RESERVATION_URL || 'http://reservation:3000',
  payment: process.env.PAYMENT_URL || 'http://payment:3003',
  room: process.env.ROOM_URL || 'http://room:3004',
};

// Configuração base do proxy
const baseProxyConfig = {
  changeOrigin: true,
  timeout: 5000, // timeout de 5s
  onError: (err, req, res) => {
    console.error('[GATEWAY] Erro no proxy:', err.code);
    res.status(502).json({ erro: 'Serviço temporariamente indisponível' });
  }
};

export function setupProxies(app) {
  // Rota pública de registro
  app.use('/register', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.user,
    pathRewrite: { '^/register': '/api/users' }
  }));

  // Rota pública de login
  app.use('/login', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.auth,
    pathRewrite: { '^/login': '/api/auth/login' }
  }));

  // Rotas protegidas
  app.use('/api/users', 
    authenticateJWT,
    authorizeRoles('admin'), // apenas admin pode gerenciar usuários
    createProxyMiddleware({ ...baseProxyConfig, target: services.user })
  );

  app.use('/api/rooms',
    authenticateJWT, // todos autenticados podem ver quartos
    createProxyMiddleware({ ...baseProxyConfig, target: services.room })
  );

  app.use('/api/reservations',
    authenticateJWT, // validação específica de roles feita no serviço
    createProxyMiddleware({ ...baseProxyConfig, target: services.reservation })
  );

  app.use('/api/payments',
    authenticateJWT,
    createProxyMiddleware({ ...baseProxyConfig, target: services.payment })
  );

  // Removido log de headers e body sensíveis
  app.use((req, res, next) => {
    console.log(`[GATEWAY] ${req.method} ${req.originalUrl}`);
    next();
  });
}