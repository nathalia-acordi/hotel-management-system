import mongoose from 'mongoose';
import { UserRepository as IUserRepository } from '../domain/UserRepository.js';

// Define o esquema do usuário para o MongoDB
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
});

// Garante que o índice exclusivo seja criado
userSchema.index({ username: 1 }, { unique: true });

const UserModel = mongoose.model('User', userSchema);

// Implementação concreta do UserRepository usando MongoDB
export class UserRepositoryImpl extends IUserRepository {
  async save(user) {
    try {
      // Check for duplicate username manually
      const existingUser = await UserModel.findOne({ username: user.username });
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const newUser = new UserModel(user);
      return await newUser.save();
    } catch (error) {
      throw error;
    }
  }

  async findByUsername(username) {
    try {
      return await UserModel.findOne({ username });
    } catch (error) {
      throw error;
    }
  }

  async getAll() {
    try {
      return await UserModel.find({}, '-password'); // Exclui o campo de senha ao listar
    } catch (error) {
      throw error;
    }
  }
}