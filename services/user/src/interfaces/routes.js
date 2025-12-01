







import express from 'express';
import { register, validate, deleteUser } from './userController.js';
import { UserRepositoryImpl } from '../infrastructure/UserRepository.js';
import { AuthService } from '../application/AuthService.js';
import { register as registerHandler } from './userController.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const authService = new AuthService();
const disableBootstrap = process.env.DISABLE_BOOTSTRAP === 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  app.use(express.json());
  
    try {
      const swaggerPath = path.join(__dirname, '../../swagger.yaml');
      if (fs.existsSync(swaggerPath)) {
        const swaggerDocument = YAML.load(swaggerPath);
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      } else {
        console.warn('[ROUTES] swagger.yaml não encontrado, pulando /docs');
      }
    } catch (err) {
      console.warn('[ROUTES] Falha ao carregar swagger.yaml:', err?.message || err);
    }

  // Provide an in-memory fallback for tests so createApp() is mountable without MongoDB.
  class InMemoryUserRepository {
    constructor() { this.users = []; }
    async save(user) {
      const exists = this.users.find(u => u.username === user.username || (user.email && u.email === user.email));
      if (exists) { const err = new Error('Username already exists'); err.httpStatus = 409; throw err; }
      const saved = { ...user, _id: `${Date.now()}${Math.random().toString(36).slice(2)}` };
      this.users.push(saved);
      return saved;
    }
    async findByUsername(username) { return this.users.find(u => u.username === username) || null; }
    async getAll() { return this.users.map(u => ({ ...u, password: undefined })); }
    async updateByUsername(username, data) {
      const idx = this.users.findIndex(u => u.username === username);
      if (idx === -1) { const err = new Error('Recurso não encontrado'); err.httpStatus = 404; throw err; }
      this.users[idx] = { ...this.users[idx], ...data };
      return this.users[idx];
    }
    async deleteByUsername(username) {
      const idx = this.users.findIndex(u => u.username === username);
      if (idx === -1) return false;
      this.users.splice(idx, 1);
      return true;
    }
  }

  function getUserRepoInstance() {
    if (global.__userRepository__) return global.__userRepository__;
    if (process.env.NODE_ENV === 'test') {
      if (!global.__inMemoryUserRepo) global.__inMemoryUserRepo = new InMemoryUserRepository();
      return global.__inMemoryUserRepo;
    }
    return new UserRepositoryImpl();
  }
  configureRoutes(app, getUserRepoInstance);
  return app;
}

export function configureRoutes(app, getUserRepoInstance) {
  

  
  app.post('/self-register', (req, res, next) => {
    req.body = { ...req.body, role: 'guest' };
    next();
  }, registerHandler);

  /**
   * @openapi
   * /self-register:
   *   post:
   *     summary: Auto-register a guest user
   *     tags:
   *       - Autenticação
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *               email:
   *                 type: string
   *     responses:
   *       '201':
   *         description: Usuário criado com sucesso
   */

  
  app.post('/register', async (req, res, next) => {
    console.log('[REGISTER ROUTE] Requisição recebida em /register');
    
    
    if (!disableBootstrap) {
      try {
        const repo = getUserRepoInstance && getUserRepoInstance();
        const existingUsers = await repo.getAll();
        console.log('[REGISTER ROUTE] existingUsers length:', existingUsers?.length || 0);
        if (!existingUsers || existingUsers.length === 0) {
          console.log('[BOOTSTRAP] Nenhum usuário encontrado. Liberando registro inicial como admin sem autenticação.');
          req.body = { ...req.body, role: 'admin' };
          console.log('[BOOTSTRAP] Body final para registro inicial:', { username: req.body.username, role: req.body.role });
          return registerHandler(req, res, next);
        }
      } catch (err) {
        console.error('[BOOTSTRAP] Falha ao verificar usuários existentes:', err?.message || err);
        
        if (!req.headers.authorization) {
          console.log('[BOOTSTRAP] Banco possivelmente indisponível; prosseguindo com bootstrap permissivo.');
          req.body = { ...req.body, role: 'admin' };
          console.log('[BOOTSTRAP] Body final (fallback) para registro inicial:', { username: req.body.username, role: req.body.role });
          return registerHandler(req, res, next);
        }
      }
    }
    
    if (!req.headers.authorization) {
      console.log('[REGISTER ROUTE] Negando acesso: sem Authorization e bootstrap indisponível ou já executado');
      return res.status(401).json({ error: 'Token ausente; bootstrap indisponível ou já executado' });
    }
    try {
      const authResponse = await authService.validateRole(req.headers.authorization, ['admin', 'receptionist']);
      if (!authResponse.isValid) {
        console.log('[REGISTER ROUTE] Auth falhou:', authResponse.message);
        return res.status(authResponse.status).json({ error: authResponse.message });
      }
      console.log('[REGISTER ROUTE] Autorizado por token. Seguindo para registerHandler.');
      next();
    } catch (error) {
      console.error('[AUTH SERVICE] Erro ao validar papel:', error);
      return res.status(500).json({ error: 'Erro interno ao validar papel' });
    }
  }, registerHandler);

  
  app.post('/validate', validate);

  
  app.get('/users', async (req, res) => {
    try {
      const authService = new AuthService();
      const authResponse = await authService.validateRole(req.headers.authorization, ['admin', 'receptionist']);
      if (!authResponse.isValid) {
        return res.status(authResponse.status).json({ error: authResponse.message || 'Unauthorized' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const repo = getUserRepoInstance();
      const usersRaw = await repo.getAll();
      const users = (usersRaw || []).map(user => {
        if (user && user._doc) {
          const { _doc: { password, ...cleanedUser } } = user;
          return cleanedUser;
        }
        const { password, ...cleanedUser } = user || {};
        return cleanedUser;
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  });

  
  app.delete('/users/:username', async (req, res, next) => {
    try {
      const authResponse = await authService.validateRole(req.headers.authorization, ['admin']);
      if (!authResponse.isValid) {
        return res.status(authResponse.status).json({ error: authResponse.message });
      }
      next();
    } catch (error) {
      console.error('[AUTH SERVICE] Erro ao validar papel:', error);
      return res.status(500).json({ error: 'Erro interno ao validar papel' });
    }
  }, deleteUser);

  
  app.put('/manage-reservations', async (req, res, next) => {
    try {
      const authResponse = await authService.validateRole(req.headers.authorization, ['receptionist']);
      if (!authResponse.isValid) {
        return res.status(authResponse.status).json({ error: authResponse.message });
      }
      next();
    } catch (error) {
      console.error('[AUTH SERVICE] Erro ao validar papel:', error);
      return res.status(500).json({ error: 'Erro interno ao validar papel' });
    }
  }, (req, res) => {
    res.status(200).json({ message: 'Reservas gerenciadas com sucesso' });
  });

  
  app.put('/manage-rooms', async (req, res, next) => {
    try {
      const authResponse = await authService.validateRole(req.headers.authorization, ['admin', 'receptionist']);
      if (!authResponse.isValid) {
        return res.status(authResponse.status).json({ error: authResponse.message });
      }
      next();
    } catch (error) {
      console.error('[AUTH SERVICE] Erro ao validar papel:', error);
      return res.status(500).json({ error: 'Erro interno ao validar papel' });
    }
  }, (req, res) => {
    res.status(200).json({ message: 'Quartos gerenciados com sucesso' });
  });

  
  app.get('/reports', async (req, res, next) => {
    try {
      const authResponse = await authService.validateRole(req.headers.authorization, ['admin', 'receptionist']);
      if (!authResponse.isValid) {
        return res.status(authResponse.status).json({ error: authResponse.message });
      }
      next();
    } catch (error) {
      console.error('[AUTH SERVICE] Erro ao validar papel:', error);
      return res.status(500).json({ error: 'Erro interno ao validar papel' });
    }
  }, (req, res) => {
    res.status(200).json({ message: 'Relatórios consultados com sucesso' });
  });
}