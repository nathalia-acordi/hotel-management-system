import axios from 'axios';
import jwt from 'jsonwebtoken';
import { publishLoginEvent, createLoginEvent } from '../infrastructure/rabbitmq.js';

// Configs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Consulta o User Service para validar credenciais
    const response = await axios.post(`${USER_SERVICE_URL}/validate`, { username, password });
  if (response.data && response.data.valid) {
      // Gera token JWT
      const token = jwt.sign({ id: response.data.id, role: response.data.role }, JWT_SECRET, { expiresIn: '1h' });
      // Publica evento de login (Strategy: publishLoginEvent)
      const event = createLoginEvent(response.data.id, username);
      await publishLoginEvent(event);
      return res.json({ token });
    }
    return res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (err) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
};