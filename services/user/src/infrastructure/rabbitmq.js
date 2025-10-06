// RabbitMQ publisher util
import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

export async function publishEvent(queue, message) {
  try {
    const conn = await amqplib.connect(RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    await channel.close();
    await conn.close();
  } catch (err) {
    throw new Error(`Erro ao publicar evento no RabbitMQ: ${err.message}`);
  }
}
