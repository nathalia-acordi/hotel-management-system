import { register, validate } from './userController.js';
import { UserRepositoryImpl } from '../infrastructure/UserRepository.js';

export function configureRoutes(app) {
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'user' }));
  app.post('/register', register);
  app.post('/validate', validate);

  app.get('/users', async (req, res) => {
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
}