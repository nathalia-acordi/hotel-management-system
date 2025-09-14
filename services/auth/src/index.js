// Entry point Auth Service
import express from 'express';

const app = express();
app.get('/', (req, res) => {
	res.send('Auth Service running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Auth Service running on port ${PORT}`);
});