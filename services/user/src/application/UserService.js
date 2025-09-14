// Application Layer: UserService (ES Modules)
import { UserRepository } from '../infrastructure/UserRepository.js';

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
}