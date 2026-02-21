import { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "";


function App() {
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");

  async function loadOrders() {
    const r = await fetch(`${API_BASE}/api/orders`);
    const data = await r.json();
    setOrders(data);
  }

  async function createOrder(e) {
    e.preventDefault();
    await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, amount: Number(amount) }),
    });
    setCustomerName("");
    setAmount("");
    await loadOrders();
  }

  useEffect(() => { loadOrders(); }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Arial" }}>
      <h2>DevSecOps TP — React Frontend</h2>

      <form onSubmit={createOrder} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button type="submit">Create order</button>
      </form>

      <button onClick={loadOrders}>Refresh</button>

      <h3>Last orders</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            #{o.id} — {o.customer_name} — {o.amount} — {o.status} — {o.created_at}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
