// Application Layer: UserService (ES Modules)
import { UserRepository } from '../infrastructure/UserRepository.js';
import { publishEvent } from '../infrastructure/rabbitmq.js';

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }
  async validateUser(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (user && user.password === password) {
      return { valid: true, id: user.id, role: user.role };
    }
    return { valid: false };
  }

  async createUser(user) {
    const saved = await this.userRepository.save(user);
    // Publica evento UserCreated no RabbitMQ
    await publishEvent('user.created', { id: saved.id, username: saved.username, role: saved.role });
    return saved;
  }
}