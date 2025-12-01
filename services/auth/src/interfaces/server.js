import express from "express";
import { attachMetrics } from "../monitoring/metrics.js";
import { login } from "./authController.js";
import { accessControl } from "../middleware/accessControl.js";
import { verify } from "../infrastructure/tokenAdapter.js";
import { getSecretSource } from "./config/secrets.js";

export function createApp({ loginMiddleware = login() } = {}) {
  const app = express();
  try {
    attachMetrics(app);
  } catch (e) {
    console.warn("[AUTH] metrics attach failed", e && e.message);
  }
  app.use(express.json());

  app.get("/health", (req, res) => {
    const body = {
      status: "ok",
      service: "auth",
      rabbitmq: Boolean(process.env.RABBITMQ_URL),
      uptime: process.uptime(),
    };
    if (process.env.NODE_ENV !== "production") {
      body.secrets = {
        jwt: getSecretSource("JWT_SECRET", "JWT_SECRET_FILE") || "none",
      };
    }
    res.status(200).json(body);
  });

  app.post("/login", loginMiddleware);

  app.get("/validate", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ isValid: false, erro: "Token ausente ou inválido" });
    }
    try {
      const token = authHeader.split(" ")[1];
      const decoded = verify(token);
      const { sub, role, iat, exp, id, username } = decoded;
      return res
        .status(200)
        .json({
          isValid: true,
          sub: sub || id,
          role,
          iat,
          exp,
          username,
          mensagem: "Token válido",
        });
    } catch (err) {
      return res
        .status(401)
        .json({ isValid: false, erro: "Token ausente ou inválido" });
    }
  });

  app.get("/", (req, res) => res.send("Auth Service running"));

  app.post(
    "/cadastrar-hospede",
    accessControl("cadastrarHospede"),
    (req, res) => {
      res.status(200).json({ mensagem: "Hóspede cadastrado com sucesso!" });
    }
  );

  app.post(
    "/gerenciar-reservas",
    accessControl("gerenciarReservas"),
    (req, res) => {
      res.status(200).json({ mensagem: "Reservas gerenciadas com sucesso!" });
    }
  );

  app.use((err, req, res, next) => {
    console.error("[GLOBAL ERROR HANDLER] Erro capturado:", err.message);
    res.status(500).json({ erro: "Erro interno do servidor" });
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Auth Service listening on port ${PORT}`);
    setInterval(() => {}, 1000);
  });
}
