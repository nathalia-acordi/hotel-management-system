import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const QUEUE = 'user.created';

export async function startUserCreatedConsumer() {
  // note: do not skip in test env so tests can assert behavior; guards below handle mocks/timeouts

  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    console.log(`[Reservation] Connected to RabbitMQ at ${RABBITMQ_URL}`);

    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    console.log(`[Reservation] Waiting for messages in ${QUEUE}...`);

    channel.consume(QUEUE, (msg) => {
      if (msg !== null) {
        try {
          const user = JSON.parse(msg.content.toString());
          console.log(`[Reservation] Novo usuário criado:`, user);
          channel.ack(msg);
        } catch (error) {
          console.error(`[Reservation] Failed to process message:`, error);
          channel.nack(msg, false, false);
        }
      }
    });

    if (conn && typeof conn.on === 'function') {
      conn.on('error', (err) => {
        console.error('[Reservation] RabbitMQ connection error:', err);
      });

      conn.on('close', () => {
        console.warn('[Reservation] RabbitMQ connection closed. Retrying...');
        // Avoid scheduling retries when running tests to prevent logs after tests finish
        if (!process.env.JEST_WORKER_ID && process.env.NODE_ENV !== 'test') {
          const t = setTimeout(startUserCreatedConsumer, 5000);
          if (t && typeof t.unref === 'function') t.unref();
        }
      });
    }
  } catch (err) {
    console.error('[Reservation] Erro ao conectar no RabbitMQ:', err);
    // During tests we don't schedule a retry to avoid async logs after tests complete
    if (!process.env.JEST_WORKER_ID && process.env.NODE_ENV !== 'test') {
      const t = setTimeout(startUserCreatedConsumer, 5000);
      if (t && typeof t.unref === 'function') t.unref();
    }
  }
}
