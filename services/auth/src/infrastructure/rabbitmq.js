import amqplib from 'amqplib';

let channel = null;

export function __resetRabbitChannel() {
  channel = null;
}

export async function getRabbitChannel() {
  if (channel) return channel;

  // In test environment, return a minimal in-memory channel to avoid network
  // calls to RabbitMQ (CI runners often don't have Rabbit available).
  if (process.env.NODE_ENV === 'test') {
    channel = {
      assertExchange: async () => {},
      publish: () => {},
    };
    return channel;
  }

  const connection = await amqplib.connect(
    process.env.RABBITMQ_URL || 'amqp://rabbitmq'
  );

  channel = await connection.createChannel();
  return channel;
}

export function createLoginEvent(userId, username) {
  return {
    type: 'auth.login',
    timestamp: new Date().toISOString(),
    userId,
    username,
  };
}

export async function publishLoginEvent(event) {
  // No-op in test environment to prevent noisy errors and external calls.
  if (process.env.NODE_ENV === 'test') return;

  const ch = await getRabbitChannel();
  await ch.assertExchange('auth', 'fanout', { durable: false });
  ch.publish('auth', '', Buffer.from(JSON.stringify(event)));
}
import amqplib from 'amqplib';




let channel = null;





export function __resetRabbitChannel() {
  channel = null;
}














export async function getRabbitChannel() {
  if (channel) return channel; 

  
  
  
  const connection = await amqplib.connect(
    process.env.RABBITMQ_URL || 'amqp://rabbitmq'
  );

  
  channel = await connection.createChannel();
  return channel;
}





export function createLoginEvent(userId, username) {
  return {
    type: 'auth.login',                 
    timestamp: new Date().toISOString(),
    userId,                             
    username                             
  };
}












export async function publishLoginEvent(event) {
  
  const ch = await getRabbitChannel();

  
  
  
  
  
  
  
  
  await ch.assertExchange('auth', 'fanout', { durable: false });

  
  
  ch.publish('auth', '', Buffer.from(JSON.stringify(event)));
}
