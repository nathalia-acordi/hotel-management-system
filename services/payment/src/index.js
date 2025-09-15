// Entry point Payment Service
import express from 'express';
import axios from 'axios';

const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3002';


const app = express();
app.use(express.json());

// Armazena pagamentos em memória
const payments = [];
let nextPaymentId = 1;

// Health check
app.get('/', (req, res) => {
	res.send('Payment Service running');
});

// Métodos aceitos
const allowedMethods = ['cartao', 'pix', 'dinheiro'];

// Criação de pagamento
app.post('/payments', async (req, res) => {
	const { reservationId, amount, method, status } = req.body;
	if (!reservationId || !amount || !method) {
		return res.status(400).json({ error: 'reservationId, amount e method são obrigatórios' });
	}
	if (!allowedMethods.includes(method)) {
		return res.status(400).json({ error: 'Método de pagamento inválido. Use: cartao, pix ou dinheiro.' });
	}
	const payment = {
		id: nextPaymentId++,
		reservationId,
		amount,
		method,
		status: status || 'pendente', // pendente, pago, cancelado
		createdAt: new Date().toISOString()
	};
	payments.push(payment);

	// Se status for "pago", atualizar reserva
			if ((status || 'pendente') === 'pago') {
				try {
					await axios.patch(`${RESERVATION_URL}/reservations/${reservationId}/payment`, { paymentStatus: 'pago' });
				} catch (err) {
					// Apenas loga, não impede pagamento
					console.error('Erro ao atualizar status da reserva:', err.message);
				}
			}

	res.status(201).json(payment);
});

// Listar pagamentos
app.get('/payments', (req, res) => {
	res.json(payments);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Payment Service running on port ${PORT}`);
});