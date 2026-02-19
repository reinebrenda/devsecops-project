require("dotenv").config();
const express = require("express");
const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: { target: "pino-pretty" },
});

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true, service: "external-service" }));

// Service annexe appelé par l'API pour "évaluer" une commande (ex: scoring)
// Ici volontairement simple et sans sécurité avancée.
app.post("/evaluate", (req, res) => {
  const { amount, customerName } = req.body || {};
  logger.info({ amount, customerName }, "evaluate called");

  // Règle volontairement naïve (ça servira à parler de risques ensuite)
  const decision = Number(amount) > 500 ? "REVIEW" : "APPROVE";

  res.json({ decision, reason: "naive-rule", ts: new Date().toISOString() });
});

const port = process.env.PORT || 4001;
app.listen(port, () => logger.info(`external-service listening on ${port}`));

