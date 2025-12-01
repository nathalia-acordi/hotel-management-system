import amqplib from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

let connection = null;
let channel = null;
let connecting = null;

export function __resetRabbitChannel() {
  if (connection) {
    // attempt to close gracefully (async), but don't throw if it fails
    connection.close().catch(() => {});
    connection = null;
  }
  channel = null;
}

export async function getRabbitChannel() {
  if (channel) return channel;

  // In test environment, return a minimal in-memory channel to avoid network
  // calls to RabbitMQ (CI runners often don't have Rabbit available).
  if (process.env.NODE_ENV === "test") {
    channel = {
      assertExchange: async () => {},
      publish: () => {},
      sendToQueue: () => {},
    };
    return channel;
  }

  try {
    if (!connection) {
      // Prevent concurrent connect attempts
      if (!connecting) connecting = amqplib.connect(RABBITMQ_URL);
      connection = await connecting;
      connecting = null;

      // when connection closes, reset refs so future calls can reconnect
      connection.on &&
        connection.on("close", () => {
          connection = null;
          channel = null;
        });
    }

    channel = await connection.createChannel();
    return channel;
  } catch (err) {
    // ensure we don't keep a partially-initialized state
    connecting = null;
    connection = null;
    channel = null;
    console.error(
      "[RabbitMQ] connection/channel error:",
      err && err.message ? err.message : err
    );
    throw err;
  }
}

export function createLoginEvent(userId, username) {
  return {
    type: "auth.login",
    timestamp: new Date().toISOString(),
    userId,
    username,
  };
}

export async function publishLoginEvent(event) {
  // No-op in test environment to prevent noisy errors and external calls.
  if (process.env.NODE_ENV === "test") return;

  try {
    const ch = await getRabbitChannel();
    await ch.assertExchange("auth", "fanout", { durable: false });
    // ch.publish is synchronous and returns a boolean; wrap in try/catch
    try {
      ch.publish("auth", "", Buffer.from(JSON.stringify(event)));
    } catch (err) {
      console.error(
        "[RabbitMQ] publish error:",
        err && err.message ? err.message : err
      );
    }
  } catch (err) {
    console.error(
      "Erro ao publicar evento no RabbitMQ:",
      err && err.message ? err.message : err
    );
  }
}

// Graceful shutdown: try to close connection if process exits
if (process.env.NODE_ENV !== "test") {
  const closeFn = () => {
    if (connection) {
      try {
        connection.close();
      } catch (e) {}
    }
  };

  process.on("exit", closeFn);
  process.on("SIGINT", () => {
    closeFn();
    // re-emit to allow normal termination
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    closeFn();
    process.exit(0);
  });
}
