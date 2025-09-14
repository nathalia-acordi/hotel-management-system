// Entry point Payment Service
import express from 'express';

const app = express();
app.get('/', (req, res) => {
	res.send('Payment Service running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Payment Service running on port ${PORT}`);
});