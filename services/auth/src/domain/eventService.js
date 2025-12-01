import { publishEvent } from "../infrastructure/eventAdapter.js";

export async function publishLogin(userId, username) {
  try {
    await publishEvent(userId, username);
  } catch (err) {
    console.error(
      "[EVENT SERVICE] Erro ao publicar evento de login:",
      err.message
    );

    throw new Error("Erro ao publicar evento de login");
  }
}
