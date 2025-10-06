import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

describe('RabbitMQ Integration', () => {
  let connection;
  let channel;
  const queueName = 'test.queue';

  beforeAll(async () => {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
  });

  afterAll(async () => {
    await channel.deleteQueue(queueName);
    await channel.close();
    await connection.close();
  });

  it('deve conectar ao RabbitMQ', async () => {
    const testConnection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    expect(testConnection).toBeDefined();
    await testConnection.close();
  });

  it('deve publicar e consumir uma mensagem', async () => {
    const message = { id: 1, name: 'Teste' };
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));

    const consumedMessage = await new Promise((resolve) => {
      channel.consume(queueName, (msg) => {
        if (msg !== null) {
          resolve(JSON.parse(msg.content.toString()));
          channel.ack(msg);
        }
      });
    });

    expect(consumedMessage).toEqual(message);
  });
});