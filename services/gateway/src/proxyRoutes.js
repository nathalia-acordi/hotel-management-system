import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateJWT, authorizeRoles } from './authMiddleware.js';


const services = {
  user: process.env.USER_URL || 'http://user:3000',
  auth: process.env.AUTH_URL || 'http://auth:3001',
  reservation: process.env.RESERVATION_URL || 'http://reservation:3000',
  payment: process.env.PAYMENT_URL || 'http://payment:3003',
  room: process.env.ROOM_URL || 'http://room:3004',
};


const baseProxyConfig = {
  changeOrigin: true,
  timeout: 15000,
  proxyTimeout: 15000,
  
  
  onProxyReq: (proxyReq, req, res) => {
    try {
      const cl = req.headers['content-length'] || 'unknown';
      const addr = req.socket && (req.socket.remoteAddress || req.socket.remotePort) ? `${req.socket.remoteAddress}:${req.socket.remotePort}` : 'unknown';
      console.debug('[GATEWAY][onProxyReq] method=%s url=%s content-length=%s remote=%s targetHost=%s', req.method, req.originalUrl || req.url, cl, addr, proxyReq.getHeader('host'));
      proxyReq.on('error', (err) => {
        console.error('[GATEWAY][proxyReq error]', err && err.stack ? err.stack : err);
      });
      proxyReq.on('finish', () => {
        console.debug('[GATEWAY][proxyReq finish] proxied request finished streaming to target');
      });
    } catch (e) {
      console.error('[GATEWAY][onProxyReq exception]', e && e.stack ? e.stack : e);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    try {
      console.debug('[GATEWAY][onProxyRes] status=%d for %s %s', proxyRes.statusCode, req.method, req.originalUrl || req.url);
      proxyRes.on('close', () => console.debug('[GATEWAY][onProxyRes] proxied response stream closed'));
    } catch (e) {
      console.error('[GATEWAY][onProxyRes exception]', e && e.stack ? e.stack : e);
    }
  },
  onError: (err, req, res) => {
    try {
      console.error('[GATEWAY][onError] proxy error:', err && (err.stack || err.message) ? (err.stack || err.message) : err);
      
      console.error('[GATEWAY][onError] req.method=%s req.url=%s req.headers.content-length=%s', req.method, req.originalUrl || req.url, req.headers && req.headers['content-length']);
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ erro: 'Serviço temporariamente indisponível' }));
      } else {
        
        try { res.end(); } catch (e) {  }
      }
    } catch (e) {
      console.error('[GATEWAY][onError handler failed]', e && e.stack ? e.stack : e);
    }
  }
};

export function setupProxies(app) {
  
  app.use('/register', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.user,
    pathRewrite: { '^/register': '/register' }
  }));

  app.use('/self-register', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.user,
    pathRewrite: { '^/self-register': '/self-register' }
  }));

  
  app.use('/login', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.auth,
    pathRewrite: { '^/login': '/login' }
  }));

  
  
  app.use('/api/payments/health', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.payment,
    pathRewrite: { '^/api/payments/health$': '/health' }
  }));

  app.use('/api/users/health', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.user,
    pathRewrite: { '^/api/users/health$': '/health' }
  }));

  app.use('/api/rooms/health', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.room,
    pathRewrite: { '^/api/rooms/health$': '/health' }
  }));

  app.use('/api/reservations/health', createProxyMiddleware({
    ...baseProxyConfig,
    target: services.reservation,
    pathRewrite: { '^/api/reservations/health$': '/health' }
  }));

  

  
  
  
  app.post('/api/users',
    authenticateJWT,
    authorizeRoles('admin'), 
    createProxyMiddleware({
      ...baseProxyConfig,
      target: services.user,
      pathRewrite: { '^/api/users': '/register' },
      logLevel: 'debug'
    })
  );

  app.get('/api/users',
    authenticateJWT,
    authorizeRoles('admin'), 
    createProxyMiddleware({
      ...baseProxyConfig,
      target: services.user,
      pathRewrite: { '^/api/users': '/users' },
      logLevel: 'debug'
    })
  );

  
  app.delete('/api/users/:username',
    authenticateJWT,
    authorizeRoles('admin'),
    createProxyMiddleware({
      ...baseProxyConfig,
      target: services.user,
      pathRewrite: { '^/api/users': '/users' },
      logLevel: 'debug'
    })
  );

  app.use('/api/rooms',
    authenticateJWT, 
    createProxyMiddleware({ 
      ...baseProxyConfig, 
      target: services.room,
      pathRewrite: { '^/api/rooms': '/rooms' },
          
    })
  );

  app.use('/api/reservations',
    authenticateJWT, 
    createProxyMiddleware({ 
      ...baseProxyConfig, 
      target: services.reservation,
      pathRewrite: { '^/api/reservations': '/reservations' },
      
      
      
    })
  );

  
  app.use('/api/payments',
    authenticateJWT,
    (req, res, next) => {
      console.log('[GATEWAY][DEBUG] Proxying /api/payments (exato)');
      console.log('Método:', req.method);
      console.log('Path original:', req.originalUrl);
      console.log('Headers:', req.headers);
      next();
    },
    createProxyMiddleware({
      ...baseProxyConfig,
      target: services.payment,
      pathRewrite: { '^/api/payments': '/payments' },
      logLevel: 'debug',
      
    })
  );

  
  app.use('/api/payments/',
    authenticateJWT,
    (req, res, next) => {
      console.log('[GATEWAY][DEBUG] Proxying /api/payments/ (subrotas)');
      console.log('Método:', req.method);
      console.log('Path original:', req.originalUrl);
      console.log('Headers:', req.headers);
      next();
    },
    createProxyMiddleware({
      ...baseProxyConfig,
      target: services.payment,
      pathRewrite: (path, req) => {
        const rewritten = path.replace(/^\/api\/payments/, '/payments');
        console.log('[GATEWAY][DEBUG] Path reescrito:', rewritten);
        return rewritten;
      },
      logLevel: 'debug'
    })
  );

  
  app.use((req, res, next) => {
    console.log(`[GATEWAY] ${req.method} ${req.originalUrl}`);
    next();
  });
}