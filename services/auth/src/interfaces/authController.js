import axios from 'axios';
import jwt from 'jsonwebtoken';
import { publishLoginEvent, createLoginEvent } from '../infrastructure/rabbitmq.js';

// authController.js do Auth Service
// - Integra com User Service para validar credenciais
// - Gera JWT para autenticação
// - Publica evento de login no RabbitMQ
// - Trata erros de rede e autenticação

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const login = async (req, res) => {
  const { username, password } = req.body;
  console.log('[AUTH] Tentando login para:', username);
  try {
    // Consulta o User Service para validar credenciais
    console.log('[AUTH] USER_SERVICE_URL:', USER_SERVICE_URL);
    console.log('[AUTH] Enviando para User Service:', USER_SERVICE_URL + '/validate', { username, password });
    let response;
    try {
      response = await axios.post(`${USER_SERVICE_URL}/validate`, { username, password });
      console.log('[AUTH] Resposta do User Service:', response.data);
    } catch (err) {
      // Log detalhado de erro na comunicação com User Service
      console.error('[AUTH] Erro ao chamar User Service /validate:', {
        url: `${USER_SERVICE_URL}/validate`,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
        stack: err?.stack
      });
      throw err;
    }
    if (response.data && response.data.valid) {
      // Gera token JWT com id e role
      const token = jwt.sign({ id: response.data.id, role: response.data.role }, JWT_SECRET, { expiresIn: '1h' });
      // Publica evento de login no RabbitMQ
      const event = createLoginEvent(response.data.id, username);
      try {
        await publishLoginEvent(event);
      } catch (err) {
        // Erro ao publicar evento não impede login
        console.error('[AUTH] Erro ao publicar evento no RabbitMQ:', err.message);
      }
      console.log('[AUTH] Login bem-sucedido, token gerado.');
      return res.json({ token });
    }
    // Credenciais inválidas
    console.log('[AUTH] Credenciais inválidas segundo User Service.');
    return res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (err) {
    // Erro de autenticação ou rede
    console.error('[AUTH] Erro ao autenticar:', {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
      stack: err?.stack
    });
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
};