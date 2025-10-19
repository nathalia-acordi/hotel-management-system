// Interface abstrata para UserRepository (ISP, DIP)
export class UserRepository {
  async save(user) { throw new Error('Not implemented'); }
  async findByUsername(username) { throw new Error('Not implemented'); }
  async getAll() { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async updateByUsername(username, data) { throw new Error('Not implemented'); }
  async deleteByUsername(username) { throw new Error('Not implemented'); }
}