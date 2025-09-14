// Express server setup (REST API) - ES Modules
import express from 'express';
import bodyParser from 'body-parser';
import { login } from './authController.js';

const app = express();
app.use(bodyParser.json());

// Endpoint de login
app.post('/login', login);

app.get('/', (req, res) => res.send('Auth Service running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Auth Service listening on port ${PORT}`));
