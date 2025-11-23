







import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

export async function publishEvent(queue, message) {
  let lastErr;
  for (let i = 1; i <= 5; i++) {
    try {
      const conn = await amqplib.connect(RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      await channel.close();
      await conn.close();
      return;
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
  throw new Error(`Erro ao publicar evento no RabbitMQ: ${lastErr?.message}`);
}
