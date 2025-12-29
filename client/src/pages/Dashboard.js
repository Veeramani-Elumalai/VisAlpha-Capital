import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Stock Input States
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [adding, setAdding] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchPortfolio = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await axios.get("http://localhost:5000/api/portfolio", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPortfolio(res.data.stocks || []);
      } catch (err) {
        alert("Session expired. Login again.");
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  // ---------------- ADD STOCK FUNCTION ----------------
  const addStock = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      await axios.post(
        "http://localhost:5000/api/portfolio/add",
        {
          symbol,
          quantity: Number(qty),
          buyPrice: Number(price),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Stock Added Successfully");

      // Clear input fields
      setSymbol("");
      setQty("");
      setPrice("");

      // Refresh Portfolio
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to add stock");
    } finally {
      setAdding(false);
    }
  };

  // ---------------- UI ----------------
  if (loading)
    return (
      <div className="center">
        <h2>Loading Portfolio...</h2>
      </div>
    );

   // ---------------- Remove Stocks ----------------
  const removeStock = async (symbol) => {
  if (!window.confirm(`Remove ${symbol}?`)) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/portfolio/remove/${symbol}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Stock Removed");
      window.location.reload();
    } catch (err) {
      alert("Failed to remove");
    }
  };

  const investedTotal = portfolio.reduce((t, s) => t + s.investedValue, 0);
  const currentTotal = portfolio.reduce((t, s) => t + s.currentValue, 0);
  const profitTotal = currentTotal - investedTotal;
  const profitPercent = investedTotal > 0 ? ((profitTotal / investedTotal) * 100).toFixed(2) : 0;


  return (
    <div className="dashboard">
      <header className="top-bar">
        <h2>📊 VisAlpha Portfolio</h2>
        <button onClick={handleLogout} className="logout">
          Logout
        </button>
      </header>
      
     {/* ---------- P/L Overall ---------- */}

      <div className="summary">
        <div>
          <h4>Invested Amount</h4>
          <p>${investedTotal.toFixed(2)}</p>
        </div>

        <div>
          <h4>Current Value</h4>
          <p>${currentTotal.toFixed(2)}</p>
        </div>

        <div>
          <h4>P/L</h4>
          <p style={{ color: profitTotal >= 0 ? "limegreen" : "red" }}>
            {profitTotal >= 0 ? `+${profitTotal.toFixed(2)}` : profitTotal.toFixed(2)}
          </p>
        </div>

        <div>
          <h4>Overall Gain %</h4>
          <p style={{ color: profitTotal >= 0 ? "limegreen" : "red" }}>
            {profitPercent}%
          </p>
        </div>
      </div>

      {/* ---------- ADD STOCK FORM ---------- */}
      <form className="add-box" onSubmit={addStock}>
        <input
          type="text"
          placeholder="Symbol e.g AAPL"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          required
        />

        <input
          type="number"
          placeholder="Quantity"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Buy Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <button type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add Stock"}
        </button>
      </form>

      {/* ---------- PORTFOLIO TABLE ---------- */}
      {portfolio.length === 0 ? (
        <p className="empty">No stocks added yet.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Stock</th>
                <th>Qty</th>
                <th>Buy Price</th>
                <th>Current Price</th>
                <th>P/L (%)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((stock, i) => (
                <tr key={i}>
                  <td>{stock.symbol}</td>
                  <td>{stock.quantity}</td>
                  <td>${stock.buyPrice}</td>
                  <td>${stock.currentPrice?.toFixed(2)}</td>
                  <td
                    style={{
                      color: stock.profitLoss >= 0 ? "limegreen" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {stock.profitLossPercent}%
                  </td>
                  <td>
                    <button
                      onClick={() => removeStock(stock.symbol)}
                      className="remove"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
