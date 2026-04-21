require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
const pino = require("pino");
const { pool } = require("./db");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: { target: "pino-pretty" },
});

const app = express();
const cors = require("cors");
app.use(cors({ origin: "http://192.168.56.113" }));
app.use(express.json());
app.use(morgan("combined"));
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 100,                // 100 requêtes max par minute
  message: { error: "Trop de requêtes, réessayez dans une minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch (e) {
    logger.error({ err: e }, "health db check failed");
    res.status(500).json({ ok: false, db: false });
  }
});

app.get("/api/orders", async (req, res) => {
  const { customerName } = req.query;
  if (customerName) {
    const r = await pool.query(
      "SELECT * FROM orders WHERE customer_name = $1 ORDER BY created_at DESC LIMIT 50",
      [customerName]
    );
    res.json(r.rows);
  } else {
    const r = await pool.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50");
    res.json(r.rows);
  }
});

app.post("/api/orders", async (req, res) => {
  const { customerName, amount } = req.body || {};

  // Validation des entrées
  if (!customerName || typeof customerName !== "string" || customerName.trim().length === 0) {
    return res.status(400).json({ error: "customerName est requis et doit être une chaîne de caractères" });
  }
  if (customerName.length > 100) {
    return res.status(400).json({ error: "customerName ne doit pas dépasser 100 caractères" });
  }
  if (/<[^>]*>/.test(customerName)) {
    return res.status(400).json({ error: "customerName contient des caracteres invalides" });
  }
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return res.status(400).json({ error: "amount est requis et doit être un nombre" });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: "amount doit être positif" });
  }
  if (Number(amount) > 1000000) {
    return res.status(400).json({ error: "amount ne doit pas dépasser 1 000 000" });
  };
  logger.info({ customerName, amount }, "create order request");

  // Appel service externe (annexe)
  const externalUrl = process.env.EXTERNAL_SERVICE_URL || "http://localhost:4001";
  const evalResp = await axios.post(`${externalUrl}/evaluate`, { customerName, amount });

  const decision = evalResp.data?.decision || "REVIEW";
  const status = decision === "APPROVE" ? "APPROVED" : "PENDING_REVIEW";

  const r = await pool.query(
    "INSERT INTO orders (customer_name, amount, status) VALUES ($1, $2, $3) RETURNING *",
    [customerName || "unknown", amount || 0, status]
  );

  res.status(201).json({ order: r.rows[0], evaluation: evalResp.data });
});

// IMPORTANT: pas de mesures avancées à ce stade => pas d’auth, pas de rate limit, etc.
const port = process.env.PORT || 4000;
app.listen(port, () => logger.info(`api listening on ${port}`));
