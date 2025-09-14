// Application Layer: UserService (ES Modules)
export class UserService {
  constructor(userRepository, eventPublisher) {
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
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
    // Publica evento UserCreated no RabbitMQ, mas não falha se der erro
    try {
      await this.eventPublisher('user.created', { id: saved.id, username: saved.username, role: saved.role });
    } catch (err) {
      console.error('Erro ao publicar evento no RabbitMQ:', err.message);
    }
    return saved;
  }
}