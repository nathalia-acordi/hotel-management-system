import jwt from "jsonwebtoken";
import { getSecret } from "../interfaces/config/secrets.js";

const JWT_SECRET =
  getSecret("JWT_SECRET", "JWT_SECRET_FILE") || "segredo_super_secreto";

export function sign(payload, options = { expiresIn: "1h" }) {
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verify(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[TOKEN ADAPTER] Erro ao verificar token:", err.message);
    }

    throw err;
  }
}
