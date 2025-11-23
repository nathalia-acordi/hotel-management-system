import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

let connection = null;
let channel = null;

export function __resetRabbitChannel() {
  if (connection) {
    // attempt to close gracefully (async), but don't throw if it fails
    connection.close().catch(() => {});
    connection = null;
  }
  channel = null;
}

export async function getRabbitChannel() {
  if (channel) return channel;

  // In test environment, return a minimal in-memory channel to avoid network
  // calls to RabbitMQ (CI runners often don't have Rabbit available).
  if (process.env.NODE_ENV === 'test') {
    channel = {
      assertExchange: async () => {},
      publish: () => {},
      sendToQueue: () => {},
    };
    return channel;
  }

  if (!connection) {
    connection = await amqplib.connect(RABBITMQ_URL);
  }

  channel = await connection.createChannel();
  return channel;
}

export function createLoginEvent(userId, username) {
  return {
    type: 'auth.login',
    timestamp: new Date().toISOString(),
    userId,
    username,
  };
}

export async function publishLoginEvent(event) {
  // No-op in test environment to prevent noisy errors and external calls.
  if (process.env.NODE_ENV === 'test') return;

  try {
    const ch = await getRabbitChannel();
    await ch.assertExchange('auth', 'fanout', { durable: false });
    ch.publish('auth', '', Buffer.from(JSON.stringify(event)));
  } catch (err) {
    console.error('Erro ao publicar evento no RabbitMQ:', err && err.message ? err.message : err);
  }
}
