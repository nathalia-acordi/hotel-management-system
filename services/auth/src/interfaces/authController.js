import axios from 'axios';
import jwt from 'jsonwebtoken';
import { publishLoginEvent, createLoginEvent } from '../infrastructure/rabbitmq.js';

// Configs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const login = async (req, res) => {
  const { username, password } = req.body;
  console.log('[AUTH] Tentando login para:', username);
  try {
    // Consulta o User Service para validar credenciais
    console.log('[AUTH] Enviando para User Service:', USER_SERVICE_URL + '/validate', { username, password });
    const response = await axios.post(`${USER_SERVICE_URL}/validate`, { username, password });
    console.log('[AUTH] Resposta do User Service:', response.data);
    if (response.data && response.data.valid) {
      // Gera token JWT
      const token = jwt.sign({ id: response.data.id, role: response.data.role }, JWT_SECRET, { expiresIn: '1h' });
      // Publica evento de login (Strategy: publishLoginEvent)
      const event = createLoginEvent(response.data.id, username);
      try {
        await publishLoginEvent(event);
      } catch (err) {
        console.error('[AUTH] Erro ao publicar evento no RabbitMQ:', err.message);
      }
      console.log('[AUTH] Login bem-sucedido, token gerado.');
      return res.json({ token });
    }
    console.log('[AUTH] Credenciais inválidas segundo User Service.');
    return res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (err) {
    console.error('[AUTH] Erro ao autenticar:', err?.response?.data || err.message);
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
};