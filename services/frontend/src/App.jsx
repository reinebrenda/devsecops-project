import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [health, setHealth] = useState(null);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [city, setCity] = useState("Paris");
  const [weather, setWeather] = useState(null);
  const [err, setErr] = useState("");

  async function fetchJson(url, options) {
    const r = await fetch(url, options);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
    return data;
  }

  useEffect(() => {
    (async () => {
      try {
        setHealth(await fetchJson(`${API_URL}/api/health`));
        setItems(await fetchJson(`${API_URL}/api/items`));
      } catch (e) {
        setErr(String(e.message || e));
      }
    })();
  }, []);

  async function addItem() {
    setErr("");
    try {
      const created = await fetchJson(`${API_URL}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItem }),
      });
      setItems((prev) => [created, ...prev]);
      setNewItem("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function loadWeather() {
    setErr("");
    try {
      const w = await fetchJson(`${API_URL}/api/weather?city=${encodeURIComponent(city)}`);
      setWeather(w);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: 18, maxWidth: 900 }}>
      <h2>DevSecOps TP — Phase 1 / Étape 2</h2>

      {err && <p style={{ color: "crimson" }}><b>Erreur:</b> {err}</p>}

      <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, marginBottom: 16 }}>
        <h3>Health</h3>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </section>

      <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, marginBottom: 16 }}>
        <h3>Items (API)</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Nouvel item" />
          <button onClick={addItem} disabled={!newItem.trim()}>Ajouter</button>
        </div>
        <ul>
          {items.map((it) => (
            <li key={it.id}>
              <b>{it.name}</b> — {it.createdAt}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <h3>Météo (service annexe)</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={city} onChange={(e) => setCity(e.target.value)} />
          <button onClick={loadWeather}>Charger</button>
        </div>
        <pre>{JSON.stringify(weather, null, 2)}</pre>
      </section>

      <p style={{ opacity: 0.7, marginTop: 18 }}>
        API_URL: <code>{API_URL}</code>
      </p>
    </div>
  );
}

