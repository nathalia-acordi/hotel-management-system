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
    console.log('[USER REPOSITORY] Tentando salvar usuário:', user);
    try {
      // Check for duplicate username manually
      const existingUser = await UserModel.findOne({ username: user.username });
      if (existingUser) {
        console.error('[USER REPOSITORY] Username já existe no banco de dados:', user.username);
        throw new Error('Username already exists');
      }

      const newUser = new UserModel(user);
      const savedUser = await newUser.save();
      console.log('[USER REPOSITORY] Usuário salvo com sucesso:', savedUser);
      return savedUser;
    } catch (error) {
      console.error('[USER REPOSITORY] Erro ao salvar usuário:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async findByUsername(username) {
    console.log('[USER REPOSITORY] Procurando usuário por username:', username);
    try {
      const user = await UserModel.findOne({ username });
      console.log('[USER REPOSITORY] Resultado da busca:', user);
      return user;
    } catch (error) {
      console.error('[USER REPOSITORY] Erro ao buscar usuário por username:', {
        message: error.message,
        stack: error.stack,
      });
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

  async deleteByUsername(username) {
    console.log('[USER REPOSITORY] Tentando deletar usuário por username:', username);
    try {
      const result = await UserModel.deleteOne({ username });
      if (result.deletedCount > 0) {
        console.log('[USER REPOSITORY] Usuário deletado com sucesso:', username);
        return true;
      } else {
        console.warn('[USER REPOSITORY] Usuário não encontrado para deleção:', username);
        return false;
      }
    } catch (error) {
      console.error('[USER REPOSITORY] Erro ao deletar usuário por username:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}