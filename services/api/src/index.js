require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");

const app = express();

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const WEATHER_SERVICE_URL = process.env.WEATHER_SERVICE_URL || "http://localhost:4000";
const LOG_FORMAT = process.env.LOG_FORMAT || "combined";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(LOG_FORMAT));

/** mini "db" en mémoire (suffisant pour Phase 1) */
const items = [];

app.get("/", (req, res) => {
  res.json({message: "Bienvenue sur notre Back End"});
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api",
    time: new Date().toISOString(),
    weatherService: WEATHER_SERVICE_URL
  });
});

// CRUD simple
app.get("/api/items", (req, res) => {
  res.json(items.slice().reverse());
});

app.post("/api/items", (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });

  const created = { id: uuidv4(), name, createdAt: new Date().toISOString() };
  items.push(created);
  console.log(`[ITEMS] created id=${created.id}`);
  res.status(201).json(created);
});

// Appel vers service annexe météo
app.get("/api/weather", async (req, res) => {
  const city = String(req.query.city || "Paris");
  const url = `${WEATHER_SERVICE_URL}/weather?city=${encodeURIComponent(city)}`;

  try {
    const r = await fetch(url, { headers: { "X-Trace": uuidv4() } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: "weather service error", details: data });
    res.json({ city, from: "weather-service", ...data });
  } catch (e) {
    res.status(502).json({ error: "weather service unreachable", details: String(e.message || e) });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[API] listening on 0.0.0.0:${PORT}`);
  console.log(`[API] CORS_ORIGIN=${CORS_ORIGIN}`);
  console.log(`[API] WEATHER_SERVICE_URL=${WEATHER_SERVICE_URL}`);
});
