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
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("combined"));

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
  const r = await pool.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50");
  res.json(r.rows);
});

app.post("/api/orders", async (req, res) => {
  // volontairement simple (pas de validation avancée)
  const { customerName, amount } = req.body || {};
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
