import { jest, describe } from '@jest/globals';
import amqplib from 'amqplib';
import * as rabbitmq from '../src/infrastructure/rabbitmq.js';

describe('infrastructure/rabbitmq', () => {
  describe('createLoginEvent', () => {
    it('deve criar evento de login corretamente', () => {
      const event = rabbitmq.createLoginEvent('123', 'user1');
      expect(event).toMatchObject({
        type: 'auth.login',
        userId: '123',
        username: 'user1',
      });
      expect(typeof event.timestamp).toBe('string');
    });
  });

  describe('getRabbitChannel', () => {
    let connectMock, createChannelMock, connectionObj;
    beforeEach(() => {
      createChannelMock = jest.fn().mockResolvedValue('mockChannel');
      connectionObj = { createChannel: createChannelMock };
      connectMock = jest.spyOn(amqplib, 'connect').mockResolvedValue(connectionObj);
      
      rabbitmq.__resetRabbitChannel();
    });
    afterEach(() => {
      connectMock.mockRestore();
    });
    it('deve criar e retornar channel se não existir', async () => {
      
      const { getRabbitChannel } = await import('../src/infrastructure/rabbitmq.js');
      const ch = await getRabbitChannel();
      expect(connectMock).toHaveBeenCalled();
      expect(ch).toBe('mockChannel');
    });
    it('deve retornar o mesmo channel se já existir', async () => {
      const { getRabbitChannel } = await import('../src/infrastructure/rabbitmq.js');
      await getRabbitChannel();
      const ch2 = await getRabbitChannel();
      expect(connectMock).toHaveBeenCalledTimes(1);
      expect(ch2).toBe('mockChannel');
    });
    it('deve lançar erro se conexão falhar', async () => {
      connectMock.mockRejectedValueOnce(new Error('Falha de conexão'));
      const { getRabbitChannel } = await import('../src/infrastructure/rabbitmq.js');
      await expect(getRabbitChannel()).rejects.toThrow('Falha de conexão');
    });
  });

  describe('publishLoginEvent', () => {
    it('deve publicar evento no exchange', async () => {
      const assertExchange = jest.fn();
      const publish = jest.fn();
      jest.spyOn(rabbitmq, 'getRabbitChannel').mockResolvedValue({
        assertExchange,
        publish
      });
      const event = { foo: 'bar' };
      await rabbitmq.publishLoginEvent(event);
      expect(assertExchange).toHaveBeenCalledWith('auth', 'fanout', { durable: false });
      expect(publish).toHaveBeenCalledWith('auth', '', Buffer.from(JSON.stringify(event)));
    });
    it('deve propagar erro se getRabbitChannel falhar', async () => {
      jest.spyOn(rabbitmq, 'getRabbitChannel').mockRejectedValue(new Error('erro de canal'));
      await expect(rabbitmq.publishLoginEvent({})).rejects.toThrow('erro de canal');
    });
  });
});




