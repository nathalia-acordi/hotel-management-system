import express from 'express';
import bodyParser from 'body-parser';
import { login } from './authController.js';

// server.js do Auth Service
// - Permite injeção de dependências (loginMiddleware) para facilitar testes
// - Expõe endpoints: health, login e raiz
// - Inicializa servidor exceto em ambiente de teste

export function createApp({ loginMiddleware = login } = {}) {
	const app = express();
	app.use(bodyParser.json());

	// Health check endpoint
	app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'auth' }));

	// Endpoint de login
	app.post('/login', loginMiddleware);

	app.get('/', (req, res) => res.send('Auth Service running'));

	return app;
}

// Inicialização padrão (exceto em testes)
if (process.env.NODE_ENV !== 'test') {
	const app = createApp();
	const PORT = process.env.PORT || 3001;
	app.listen(PORT, () => {
		console.log(`Auth Service listening on port ${PORT}`);
		setInterval(() => {}, 1000); // Mantém o event loop ativo
	});
}
