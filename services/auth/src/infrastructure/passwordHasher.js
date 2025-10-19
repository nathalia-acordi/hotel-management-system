import bcrypt from 'bcryptjs';

export default class PasswordHasher {
  async compare(plain, hash) {
    try { return await bcrypt.compare(plain, hash); } catch { return false; }
  }
}
