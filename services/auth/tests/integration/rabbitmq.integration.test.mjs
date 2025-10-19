import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import amqplib from 'amqplib';
import * as rabbitmq from '../../src/infrastructure/rabbitmq.js';

if (process.env.JEST_INTEGRATION !== '1') {
  describe('RabbitMQ Integration (disabled)', () => {
    it('set JEST_INTEGRATION=1 to run', () => expect(true).toBe(true));
  });
} else {
  jest.mock('amqplib');

  describe('RabbitMQ Integration', () => {
    let mockChannel;
    let mockConnection;

    beforeEach(() => {
      mockChannel = { assertExchange: jest.fn(), publish: jest.fn() };
      mockConnection = { createChannel: jest.fn().mockResolvedValue(mockChannel) };
      amqplib.connect.mockResolvedValue(mockConnection);
      rabbitmq.__resetRabbitChannel();
    });

    it('should create and reuse a RabbitMQ channel', async () => {
      const channel1 = await rabbitmq.getRabbitChannel();
      const channel2 = await rabbitmq.getRabbitChannel();
      expect(channel1).toBe(channel2);
      expect(amqplib.connect).toHaveBeenCalledTimes(1);
      expect(mockConnection.createChannel).toHaveBeenCalledTimes(1);
    });

    it('should publish a login event', async () => {
      const event = { type: 'auth.login', userId: 1, username: 'test_user' };
      const channel = await rabbitmq.getRabbitChannel();
      await rabbitmq.publishLoginEvent(event);
      expect(channel.assertExchange).toHaveBeenCalledWith('auth', 'fanout', { durable: false });
      expect(channel.publish).toHaveBeenCalledWith('auth', '', Buffer.from(JSON.stringify(event)));
    });
  });
}
