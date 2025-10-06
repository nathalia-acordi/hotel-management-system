import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateJWT } from './authMiddleware.js';

// URLs dos microsserviços (ajuste conforme necessário)
const services = {
  user: 'http://user:3000',
  auth: 'http://auth:3001',
  reservation: 'http://reservation:3000',
  payment: 'http://payment:3003',
  room: 'http://room:3004',
};

export function setupProxies(app) {
  // User Service
  app.use('/users', authenticateJWT, createProxyMiddleware({ target: services.user, changeOrigin: true }));

  // Middleware para garantir body JSON serializado corretamente antes do proxy /register
  app.use('/register', (req, res, next) => {
    console.log(`[GATEWAY] Recebido ${req.method} ${req.originalUrl}`);
    // Se for POST, PUT ou PATCH, garanta que o body está serializado
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.is('application/json') && req.body) {
      req.rawBody = JSON.stringify(req.body);
    }
    next();
  });
  app.use('/register', createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // Serializa o body manualmente se existir
      if (req.rawBody) {
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
        proxyReq.write(req.rawBody);
        proxyReq.end();
      }
      console.log('[GATEWAY] Encaminhando para user:', req.method, req.originalUrl, 'body:', req.body);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('[GATEWAY] Resposta recebida do user para', req.method, req.originalUrl);
    }
  }));

  // Auth Service
  // Middleware para garantir body JSON serializado corretamente antes do proxy /login
  app.use('/login', (req, res, next) => {
    console.log(`[GATEWAY] Recebido ${req.method} ${req.originalUrl}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.is('application/json') && req.body) {
      req.rawBody = JSON.stringify(req.body);
    }
    next();
  });
  app.use('/login', createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      if (req.rawBody) {
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
        proxyReq.write(req.rawBody);
        proxyReq.end();
      }
      console.log('[GATEWAY] Encaminhando para auth:', req.method, req.originalUrl, 'body:', req.body);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('[GATEWAY] Resposta recebida do auth para', req.method, req.originalUrl);
    }
  }));
  app.use('/validate', createProxyMiddleware({ target: services.auth, changeOrigin: true }));

  // Reservation Service
  app.use('/reservations', authenticateJWT, createProxyMiddleware({ target: services.reservation, changeOrigin: true }));

  // Payment Service
  app.use('/payments', authenticateJWT, createProxyMiddleware({ target: services.payment, changeOrigin: true }));

  // Room Service
  app.use('/rooms', authenticateJWT, createProxyMiddleware({ target: services.room, changeOrigin: true }));

  // Guests (Reservation Service)
  app.use('/guests', (req, res, next) => {
    console.log(`[GATEWAY] ${req.method} /guests`);
    console.log('[GATEWAY] Headers:', req.headers);
    console.log('[GATEWAY] Body:', req.body);
    next();
  }, authenticateJWT, createProxyMiddleware({ target: services.reservation, changeOrigin: true }));
}
