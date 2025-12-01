import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateJWT, authorizeRoles } from './authMiddleware.js';
import { startTestStubs } from './testStubs.js';

// NOTE: we must NOT statically import other services' source files here.
// Those files are present only in the monorepo workspace and are not
// available inside production Docker images. Import them dynamically
// inside `setupProxies` when running under `NODE_ENV==='test'` so that
// the gateway can run inside containers without attempting to resolve
// filesystem imports to other services.



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

export async function setupProxies(app) {
  if (process.env.NODE_ENV === 'test') {
    // In test mode we try to mount in-process app instances from sibling
    // packages so integration tests can run without Docker. These imports
    // live in other packages in the repo and will not exist inside the
    // production images, so import them dynamically and fail gracefully.
    let mountedAny = false;
    let userApp, authApp, reservationApp, roomApp, paymentApp;

    // Try dynamic import of user app
    try {
      const userMod = await import('../../user/src/interfaces/server.js').catch(() => null);
      const createUserApp = userMod && (userMod.createApp || (userMod.default && userMod.default.createApp));
      if (createUserApp) {
        try { userApp = createUserApp(); } catch (e) { console.warn('[GATEWAY] userApp create failed', e && e.message); }
        if (userApp) {
          app.use('/', userApp);
          app.use('/api', userApp);
          mountedAny = true;
        }
      }
    } catch (e) { console.warn('[GATEWAY] Skipped mounting user app:', e && e.message); }

    // Auth app
    try {
      const authMod = await import('../../auth/src/interfaces/server.js').catch(() => null);
      const createAuthApp = authMod && (authMod.createApp || (authMod.default && authMod.default.createApp));
      if (createAuthApp) {
        try { authApp = createAuthApp(); } catch (e) { console.warn('[GATEWAY] authApp create failed', e && e.message); }
        if (authApp) { app.use('/', authApp); mountedAny = true; }
      }
    } catch (e) { console.warn('[GATEWAY] Skipped mounting auth app:', e && e.message); }

    // Payment app (may export an express app as default)
    try {
      const payMod = await import('../../payment/src/index.mjs').catch(() => null);
      const paymentCandidate = payMod && (payMod.default || payMod);
      if (paymentCandidate) {
        try { paymentApp = paymentCandidate; } catch (e) { console.warn('[GATEWAY] paymentApp attach failed', e && e.message); }
        if (paymentApp) { app.use('/api', paymentApp); mountedAny = true; }
      }
    } catch (e) { console.warn('[GATEWAY] Skipped mounting payment app:', e && e.message); }

    // Reservation app
    try {
      const resMod = await import('../../reservation/src/index.js').catch(() => null);
      const createReservationApp = resMod && (resMod.createApp || (resMod.default && resMod.default.createApp));
      if (createReservationApp) {
        try { reservationApp = createReservationApp(); } catch (e) { console.warn('[GATEWAY] reservationApp create failed', e && e.message); }
        if (reservationApp) { app.use('/api', reservationApp); mountedAny = true; }
      }
    } catch (e) { console.warn('[GATEWAY] Skipped mounting reservation app:', e && e.message); }

    // Room app
    try {
      const roomMod = await import('../../room/src/index.mjs').catch(() => null);
      const createRoomApp = roomMod && (roomMod.createApp || (roomMod.default && roomMod.default.createApp));
      if (createRoomApp) {
        try { roomApp = createRoomApp(); } catch (e) { console.warn('[GATEWAY] roomApp create failed', e && e.message); }
        if (roomApp) { app.use('/api', roomApp); mountedAny = true; }
      }
    } catch (e) { console.warn('[GATEWAY] Skipped mounting room app:', e && e.message); }

    if (mountedAny) {
      console.log('[GATEWAY] Mounted available in-process service apps for test environment');
      try {
        if (!process.env.JEST_WORKER_ID) {
          process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';
          const { servers, ports } = await startTestStubs({ userApp, authApp, reservationApp, paymentApp, roomApp });
          if (ports) {
            if (ports.user) process.env.USER_URL = `http://127.0.0.1:${ports.user}`;
            if (ports.auth) process.env.AUTH_URL = `http://127.0.0.1:${ports.auth}`;
            if (ports.reservation) process.env.RESERVATION_URL = `http://127.0.0.1:${ports.reservation}`;
            if (ports.payment) process.env.PAYMENT_URL = `http://127.0.0.1:${ports.payment}`;
            if (ports.room) process.env.ROOM_URL = `http://127.0.0.1:${ports.room}`;
          }
          console.log('[GATEWAY] Started test stub servers for mounted apps', ports);
          try { if (global.__inMemoryUserRepo) global.__inMemoryUserRepo.users = []; } catch (e) {}
          global.__testStubServers = servers || [];
        }
      } catch (e) {
        console.warn('[GATEWAY] Failed starting test stub servers:', e && e.message);
      }
      return;
    } else {
      console.warn('[GATEWAY] No in-process service apps mounted for tests; will use proxies');
    }
  }
  
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