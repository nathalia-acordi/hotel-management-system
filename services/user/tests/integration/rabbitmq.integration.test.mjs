import amqp from 'amqplib';
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';

if (process.env.JEST_INTEGRATION !== '1') {
  describe('User RabbitMQ Integration (disabled)', () => {
    it('set JEST_INTEGRATION=1 to run', () => expect(true).toBe(true));
  });
} else {
  let connection;
  let channel;

  describe('User RabbitMQ Integration', () => {
    beforeAll(async () => {
      connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
      channel = await connection.createChannel();
      await channel.assertQueue('user.events', { durable: true });
    });

    afterAll(async () => {
      if (channel) await channel.close();
      if (connection) await connection.close();
    });

    it('deve conectar ao RabbitMQ', async () => {
      const testConnection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
      const ch = await testConnection.createChannel();
      await ch.assertQueue('user.events', { durable: true });
      await ch.close();
      await testConnection.close();
      expect(true).toBe(true);
    });
  });
}
