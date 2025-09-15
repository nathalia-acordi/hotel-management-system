// Entry point Room Service
import express from 'express';

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
app.post('/rooms', (req, res) => {
	const { number, type, price } = req.body;
	if (!number || !type || !price) {
		return res.status(400).json({ error: 'number, type e price são obrigatórios' });
	}
	const room = { id: nextRoomId++, number, type, price };
	rooms.push(room);
	res.status(201).json(room);
});

// Listar quartos
app.get('/rooms', (req, res) => {
	res.json(rooms);
});

const PORT = process.env.PORT || 3004;
if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => {
		console.log(`Room Service running on port ${PORT}`);
	});
}

export default app;