import mongoose from 'mongoose';
import { UserRepository as IUserRepository } from '../domain/UserRepository.js';

// Define o esquema do usuário para o MongoDB
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, index: true },
  document: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'receptionist', 'guest'], default: 'guest' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// Garante que o índice exclusivo seja criado
userSchema.index({ username: 1 }, { unique: true });

const UserModel = mongoose.model('User', userSchema);

// Implementação concreta do UserRepository usando MongoDB
export class UserRepositoryImpl extends IUserRepository {
  async save(user) {
    console.log('[USER REPOSITORY] Tentando salvar usuário:', { username: user?.username, email: user?.email, role: user?.role });
    try {
      // Check for duplicates
      const dup = await UserModel.findOne({ $or: [ { username: user.username }, { email: user.email }, { document: user.document } ] });
      if (dup) {
        const field = dup.email === user.email ? 'email' : (dup.document === user.document ? 'document' : 'username');
        const err = new Error('Conflito: usuário já existe');
        err.httpStatus = 409;
        throw err;
      }

      const newUser = new UserModel(user);
      const savedUser = await newUser.save();
      console.log('[USER REPOSITORY] Usuário salvo com sucesso:', { id: savedUser._id, username: savedUser.username, role: savedUser.role });
      return savedUser;
    } catch (error) {
      console.error('[USER REPOSITORY] Erro ao salvar usuário:', {
        message: error.message,
        stack: error.stack,
      });
      // translate mongo duplicate key
      if (error.code === 11000) {
        const err = new Error('Conflito: usuário já existe');
        err.httpStatus = 409;
        throw err;
      }
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

  async findById(id) {
    console.log('[USER REPOSITORY] Procurando usuário por id:', id);
    try {
      const user = await UserModel.findById(id);
      return user;
    } catch (error) {
      console.error('[USER REPOSITORY] Erro ao buscar usuário por id:', { message: error.message });
      throw error;
    }
  }

  async updateByUsername(username, data) {
    console.log('[USER REPOSITORY] Atualizando usuário por username:', { username, fields: Object.keys(data || {}) });
    try {
      // Nunca atualizar senha diretamente aqui
      const { password, ...rest } = data || {};
      const updated = await UserModel.findOneAndUpdate({ username }, rest, { new: true, runValidators: true });
      if (!updated) {
        const err = new Error('Recurso não encontrado');
        err.httpStatus = 404;
        throw err;
      }
      return updated;
    } catch (error) {
      if (error.code === 11000) {
        const err = new Error('Conflito: usuário já existe');
        err.httpStatus = 409;
        throw err;
      }
      if (error.name === 'ValidationError') {
        const err = new Error('Dados inválidos');
        err.httpStatus = 400;
        throw err;
      }
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