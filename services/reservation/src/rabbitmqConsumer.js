import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = 'user.created';

export async function startUserCreatedConsumer() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    console.log(`[Reservation] Waiting for messages in ${QUEUE}...`);
    channel.consume(QUEUE, (msg) => {
      if (msg !== null) {
        const user = JSON.parse(msg.content.toString());
        console.log(`[Reservation] Novo usuário criado:`, user);
        // Apenas loga o novo usuário recebido
        console.log(`[Reservation] Usuário registrado recebido:`, user);
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('[Reservation] Erro ao conectar no RabbitMQ:', err);
  }
}
