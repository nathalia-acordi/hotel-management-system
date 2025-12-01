import { sign } from "../infrastructure/tokenAdapter.js";

export function generateToken(payload) {
  return sign(payload);
}
