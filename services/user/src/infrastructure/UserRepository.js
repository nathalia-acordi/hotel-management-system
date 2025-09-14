// Infrastructure Layer: UserRepository (Singleton, ES Modules)
const users = [
  // Usuário de exemplo
  { id: 1, username: 'admin', password: 'admin', role: 'admin' }
];

export class UserRepository {
  static instance;
  constructor() {
    if (UserRepository.instance) return UserRepository.instance;
    UserRepository.instance = this;
  }
  async findByUsername(username) {
    return users.find(u => u.username === username);
  }
}