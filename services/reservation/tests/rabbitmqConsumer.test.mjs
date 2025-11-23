import { jest } from '@jest/globals';

describe('rabbitmqConsumer', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('deve consumir mensagem e chamar ack', async () => {
    const fakeMsg = { content: Buffer.from(JSON.stringify({ id: 1, name: 'Test' })), ack: jest.fn() };
    const consume = jest.fn((queue, cb) => { cb(fakeMsg); });
    const assertQueue = jest.fn();
    const createChannel = jest.fn().mockResolvedValue({
      assertQueue,
      consume,
      ack: jest.fn()
    });
    
    jest.unstable_mockModule && jest.unstable_mockModule('amqplib', () => ({
      default: { connect: jest.fn().mockResolvedValue({ createChannel }) }
    }));
    const { startUserCreatedConsumer } = await import('../src/rabbitmqConsumer.js');
    await startUserCreatedConsumer();
    expect(assertQueue).toHaveBeenCalledWith('user.created', { durable: true });
    expect(consume).toHaveBeenCalled();
  });

  it('deve logar erro se conexão falhar', async () => {
    const error = new Error('fail');
    jest.unstable_mockModule && jest.unstable_mockModule('amqplib', () => ({
      default: { connect: jest.fn().mockRejectedValue(error) }
    }));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { startUserCreatedConsumer } = await import('../src/rabbitmqConsumer.js');
    await startUserCreatedConsumer();
    expect(spy).toHaveBeenCalledWith('[Reservation] Erro ao conectar no RabbitMQ:', error);
    spy.mockRestore();
  });
});
