import { publishLoginEvent, createLoginEvent } from './rabbitmq.js';

export async function publishEvent(userId, username) {
  const event = createLoginEvent(userId, username);
  try {
    await publishLoginEvent(event);
  } catch (err) {
    console.error('[EVENT ADAPTER] Erro ao publicar evento:', err.message);
    throw err;
  }
}