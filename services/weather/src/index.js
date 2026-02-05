require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 4000;
const LOG_FORMAT = process.env.LOG_FORMAT || "combined";

app.use(express.json());
app.use(morgan(LOG_FORMAT));

/**
 * Healthcheck
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "weather",
    time: new Date().toISOString()
  });
});

/**
 * GET /weather?city=Paris
 * - géocodage dynamique via Open-Meteo
 * - météo en temps réel
 */
app.get("/weather", async (req, res) => {
  const city = String(req.query.city || "").trim();

  if (!city) {
    return res.status(400).json({ error: "city parameter is required" });
  }

  try {
    /* 1️⃣ Géocodage : ville → lat/lon */
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`;

    const geoResp = await fetch(geoUrl);
    const geoData = await geoResp.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: `city '${city}' not found` });
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    /* 2️⃣ Météo */
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    const weatherResp = await fetch(weatherUrl);
    const weatherData = await weatherResp.json();

    const cw = weatherData?.current_weather || {};

    /* 3️⃣ Réponse */
    res.json({
      city: name,
      country,
      coords: {
        lat: latitude,
        lon: longitude
      },
      current: {
        temperature: cw.temperature,
        windspeed: cw.windspeed,
        weathercode: cw.weathercode,
        time: cw.time
      }
    });

  } catch (e) {
    res.status(502).json({
      error: "weather service unavailable",
      details: String(e.message || e)
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[WEATHER] listening on 0.0.0.0:${PORT}`);
});
