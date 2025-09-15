const amqp = require('amqplib');
const axios = require('axios');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE = 'auth';

describe('RabbitMQ Integration: Auth Service', () => {
  let connection;
  let channel;
  let queueName;

  beforeAll(async () => {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'fanout', { durable: false });
    // Cria fila temporária exclusiva para o teste
    const q = await channel.assertQueue('', { exclusive: true });
    queueName = q.queue;
    await channel.bindQueue(queueName, EXCHANGE, '');
  });

  afterAll(async () => {
    await channel.deleteQueue(queueName);
    await channel.close();
    await connection.close();
  });

  it('deve publicar evento de login no RabbitMQ ao autenticar', async () => {
    // Realiza login válido via Auth Service
    const res = await axios.post('http://localhost:3001/login', { username: 'integration', password: '123' });
    expect(res.status).toBe(200);
    const { token } = res.data;
    expect(token).toBeDefined();

    // Aguarda mensagem na fila temporária e fecha o consumer após receber
    const msg = await new Promise((resolve, reject) => {
      let consumerTag;
      channel.consume(queueName, (msg) => {
        if (msg) {
          channel.ack(msg);
          channel.cancel(consumerTag); // Cancela o consumer explicitamente
          resolve(msg.content.toString());
        }
      }, { noAck: false })
      .then(({ consumerTag: tag }) => { consumerTag = tag; });
      setTimeout(() => reject(new Error('Timeout esperando mensagem RabbitMQ')), 2000);
    });
    expect(msg).toContain('integration');
  });
});
