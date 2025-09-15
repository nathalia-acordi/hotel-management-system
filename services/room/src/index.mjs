import express from 'express';
import { authenticateJWT as defaultAuthenticateJWT, isAdmin as defaultIsAdmin } from './authMiddleware.js';
import { RoomFactory } from './domain/RoomFactory.js';

export function createApp({ authenticateJWT = defaultAuthenticateJWT, isAdmin = defaultIsAdmin } = {}) {
  const app = express();
  app.use(express.json());

  // Armazena quartos em memória
  const rooms = [];
  let nextRoomId = 1;

  // Health check
  app.get('/', (req, res) => {
    res.send('Room Service running');
  });

  // Criação de quarto
  app.post('/rooms', authenticateJWT, isAdmin, (req, res) => {
    const { number, type, price } = req.body;
    if (number == null || type == null || price == null) {
      return res.status(400).json({ error: 'number, type e price são obrigatórios' });
    }
    // Número de quarto deve ser inteiro positivo
    if (typeof number !== 'number' || number <= 0 || !Number.isInteger(number)) {
      return res.status(400).json({ error: 'Número de quarto inválido' });
    }
    // Preço deve ser positivo
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'Preço deve ser positivo' });
    }
    // Tipo deve ser um dos permitidos
    const tiposValidos = ['single', 'double', 'suite'];
    if (!tiposValidos.includes(type)) {
      return res.status(400).json({ error: 'Tipo de quarto inválido' });
    }
    // Não pode haver número duplicado
    if (rooms.some(r => r.number === number)) {
      return res.status(400).json({ error: 'Número de quarto já cadastrado' });
    }
    try {
      const room = RoomFactory.create(type, number, price);
      room.id = nextRoomId++;
      rooms.push(room);
      res.status(201).json(room);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Listar quartos (público)
  app.get('/rooms', (req, res) => {
    res.json(rooms);
  });

  return app;
}

const app = createApp();


const PORT = process.env.PORT || 3004;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Room Service running on port ${PORT}`);
  });
}

export default app;
