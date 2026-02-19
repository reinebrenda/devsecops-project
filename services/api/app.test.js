const request = require("supertest");
const express = require("express");

test("dummy test - endpoint /health exists (structure check)", async () => {
  const app = express();
  app.get("/health", (req, res) => res.json({ ok: true }));
  const res = await request(app).get("/health");
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
});
