// Express server setup (REST API) - ES Modules
import express from 'express';
import bodyParser from 'body-parser';
import { validate, register } from './userController.js';

const app = express();
app.use(bodyParser.json());


// Endpoint de cadastro de usuário
app.post('/register', register);

// Endpoint de validação de usuário
app.post('/validate', validate);

app.get('/', (req, res) => res.send('User Service running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`User Service listening on port ${PORT}`));
