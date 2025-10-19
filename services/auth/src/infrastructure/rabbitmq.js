import amqplib from 'amqplib';


let channel = null;

// Função de reset para testes (não afeta produção)
export function __resetRabbitChannel() {
  channel = null;
}

export async function getRabbitChannel() {
  if (channel) return channel; // Singleton: sempre retorna a mesma instância
  const connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
  channel = await connection.createChannel();
  return channel;
}

// Factory Method (GoF) para criar mensagens de evento
export function createLoginEvent(userId, username) {
  return {
    type: 'auth.login',
    timestamp: new Date().toISOString(),
    userId,
    username
  };
}

export async function publishLoginEvent(event) {
  const ch = await getRabbitChannel();
  await ch.assertExchange('auth', 'fanout', { durable: false });
  ch.publish('auth', '', Buffer.from(JSON.stringify(event)));
}
