import mongoose from 'mongoose';

export function connectToDatabase() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/user';

  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('Conexão com o MongoDB Atlas bem-sucedida'))
    .catch(err => console.error('Erro ao conectar ao MongoDB Atlas:', err));

  const db = mongoose.connection;
  db.on('connected', () => {
    console.log('[USER] Conectado ao MongoDB:', mongoURI);
  });
  db.on('error', (err) => {
    console.error('[USER] Erro ao conectar ao MongoDB:', err);
  });
}

connectToDatabase();