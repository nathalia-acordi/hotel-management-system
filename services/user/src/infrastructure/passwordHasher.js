import bcrypt from "bcryptjs";

export class BcryptPasswordHasher {
  constructor(rounds = 10) {
    this.rounds = rounds;
  }

  async hash(plain) {
    const salt = await bcrypt.genSalt(this.rounds);
    return bcrypt.hash(plain, salt);
  }

  async compare(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}
