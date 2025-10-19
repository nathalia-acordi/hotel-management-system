import express from 'express';
import { register, validate, deleteUser } from './userController.js';
import { UserRepositoryImpl } from '../infrastructure/UserRepository.js';
import { AuthService } from '../application/AuthService.js';
import { register as registerHandler } from './userController.js';

const authService = new AuthService();

export function createApp() {
  const app = express();
  app.use(express.json());
  configureRoutes(app);
  return app;
}

export function configureRoutes(app) {
  // Health é tratado em server.js com detalhes enriquecidos

  // Auto-cadastro (público) força role='guest'
  app.post('/self-register', (req, res, next) => {
    req.body = { ...req.body, role: 'guest' };
    next();
  }, registerHandler);

  // Cadastrar hóspede (permitido para Admin e Recepcionista)
  app.post('/register', async (req, res, next) => {
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
  }, registerHandler);

  // Validar credenciais (sem restrição de acesso)
  app.post('/validate', validate);

  // Listar usuários (permitido para Admin e Recepcionista)
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

  // Deletar usuário por username (permitido para Admin)
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

  // Gerenciar reservas (permitido apenas para Recepcionista)
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

  // Gerenciar quartos (permitido para Admin e Recepcionista)
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

  // Consultar relatórios (permitido para Admin e Recepcionista)
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