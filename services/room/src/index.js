// Entry point Room Service
import express from 'express';

const app = express();
app.get('/', (req, res) => {
	res.send('Room Service running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Room Service running on port ${PORT}`);
});