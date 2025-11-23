







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
  configureRoutes(app);
  return app;
}

export function configureRoutes(app) {
  

  
  app.post('/self-register', (req, res, next) => {
    req.body = { ...req.body, role: 'guest' };
    next();
  }, registerHandler);

  
  app.post('/register', async (req, res, next) => {
    console.log('[REGISTER ROUTE] Requisição recebida em /register');
    
    
    if (!disableBootstrap) {
      try {
        const repo = new UserRepositoryImpl();
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
      const repo = new UserRepositoryImpl();
      const users = (await repo.getAll()).map(user => {
        const { _doc: { password, ...cleanedUser } } = user;
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