// Interface abstrata para UserRepository (ISP, DIP)
export class UserRepository {
  async save(user) { throw new Error('Not implemented'); }
  async findByUsername(username) { throw new Error('Not implemented'); }
  getAll() { throw new Error('Not implemented'); }
}