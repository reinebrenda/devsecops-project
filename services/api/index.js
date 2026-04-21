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
    return res.status(400).json({ error: "customerName est requis" });
  }
  if (customerName.trim().length < 2) {
    return res.status(400).json({ error: "customerName doit avoir au moins 2 caracteres" });
  }
  if (customerName.trim().length > 50) {
    return res.status(400).json({ error: "customerName ne doit pas depasser 50 caracteres" });
  }
  if (!/^[a-zA-ZÀ-ÿ\s\-]+$/.test(customerName.trim())) {
    return res.status(400).json({ error: "customerName ne doit contenir que des lettres — chiffres et caracteres speciaux interdits" });
  }
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return res.status(400).json({ error: "amount doit etre un nombre" });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: "amount doit etre positif" });
  }
  if (Number(amount) > 1000000) {
    return res.status(400).json({ error: "amount ne doit pas depasser 1 000 000" });
  }
  if (!Number.isFinite(Number(amount))) {
    return res.status(400).json({ error: "amount invalide" });
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
