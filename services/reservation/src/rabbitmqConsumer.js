import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = 'user.created';

export async function startUserCreatedConsumer() {
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
          channel.nack(msg, false, false); // Reject the message without requeueing
        }
      }
    });

    conn.on('error', (err) => {
      console.error('[Reservation] RabbitMQ connection error:', err);
    });

    conn.on('close', () => {
      console.warn('[Reservation] RabbitMQ connection closed. Retrying...');
      setTimeout(startUserCreatedConsumer, 5000); // Retry connection after 5 seconds
    });
  } catch (err) {
    console.error('[Reservation] Erro ao conectar no RabbitMQ:', err);
    setTimeout(startUserCreatedConsumer, 5000); // Retry connection after 5 seconds
  }
}
