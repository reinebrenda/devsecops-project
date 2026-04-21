import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_BASE || "";

function StatusBadge({ status }) {
  const cls =
    status === "APPROVED"
      ? "status-badge status-approved"
      : status === "PENDING_REVIEW"
      ? "status-badge status-pending"
      : "status-badge status-default";
  return <span className={cls}>{status}</span>;
}

function App() {
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/orders`);
      const data = await r.json();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  async function createOrder(e) {
    e.preventDefault();
    if (!customerName || !amount) return;
    await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, amount: Number(amount) }),
    });
    setCustomerName("");
    setAmount("");
    await loadOrders();
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="app">

      {/* Header */}
      <header className="app-header">
        <h1>DevSecOps TP — Gestion des commandes</h1>
        <p className="subtitle">React Frontend · API Node.js · PostgreSQL · k3s</p>
      </header>

      {/* Formulaire création */}
      <div className="card">
        <div className="card-title">Nouvelle commande</div>
        <form onSubmit={createOrder} className="order-form">
          <input
            placeholder="Nom du client"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <input
            placeholder="Montant (€)"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            Créer
          </button>
        </form>
      </div>

      {/* Liste des commandes */}
      <div className="card">
        <div className="toolbar">
          <h2>Commandes récentes</h2>
          <button onClick={loadOrders} className="btn btn-secondary">
            {loading ? "Chargement…" : "Actualiser"}
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">Aucune commande pour le moment.</div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><span className="order-id">#{o.id}</span></td>
                  <td>{o.customer_name}</td>
                  <td>{Number(o.amount).toFixed(2)} €</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

export default App;
