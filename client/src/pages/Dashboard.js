import { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";


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
  const dailyChangeTotal = portfolio.reduce((t, s) => t + s.dayChange * s.quantity, 0);
  const dailyChangePercent = currentTotal > 0 ? ((dailyChangeTotal / currentTotal) * 100).toFixed(2) : 0;


  return (
    <div className="dashboard">
      <header className="top-bar">
        <h2>📊 VisAlpha Portfolio</h2>
        <button onClick={handleLogout} className="logout">
          Logout
        </button>
      </header>
      
     {/* ---------- P/L Summary ---------- */}

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
          <h4>Daily Change</h4>
          <p style={{ color: dailyChangeTotal >= 0 ? "limegreen" : "red" }}>
            {dailyChangeTotal >= 0 ? "+" : ""}
            {dailyChangeTotal.toFixed(2)} ({dailyChangePercent}%)
          </p>
        </div>

        <div>
          <h4>Overall Gain %</h4>
          <p style={{ color: profitTotal >= 0 ? "limegreen" : "red" }}>
            {profitPercent}%
          </p>
        </div>
      </div>

      {/* ---------- Pie Wrapper ---------- */}

      <div className="charts-row">

        {/* ---------- Holdings Pie ---------- */}

        {portfolio.length > 0 && (
          <div className="chart small">
            <h3 style={{ color: "white" }}>Holdings Allocation</h3>

            <Pie
              data={{
                labels: portfolio.map(s => s.symbol),
                datasets: [
                  {
                    data: portfolio.map(s => s.currentValue),
                    backgroundColor: [
                      "#22c55e",
                      "#3b82f6",
                      "#eab308",
                      "#ef4444",
                      "#a855f7",
                      "#14b8a6",
                      "#f97316"
                    ]
                  }
                ]
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.raw || 0;

                        const total = context.chart._metasets[0].total;
                        const percentage = ((value / total) * 100).toFixed(2);

                        return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />

          </div>
        )}

        {/* ---------- Sectorwise Pie ---------- */}

        {portfolio.length > 0 && (
          <div className="chart small">
            <h3 style={{ color: "white" }}>Sector Allocation</h3>

            <Pie
              data={{
                labels: [...new Set(portfolio.map(s => s.sector))],
                datasets: [
                  {
                    data: [...new Set(portfolio.map(s => s.sector))].map(sec =>
                      portfolio
                        .filter(s => s.sector === sec)
                        .reduce((t, s) => t + s.currentValue, 0)
                    ),
                    backgroundColor: [
                      "#3b82f6",
                      "#22c55e",
                      "#eab308",
                      "#f43f5e",
                      "#a855f7",
                      "#06b6d4"
                    ]
                  }
                ]
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.raw || 0;

                        const total = context.chart._metasets[0].total;
                        const percentage = ((value / total) * 100).toFixed(2);

                        return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />

          </div>
        )}
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
                <th>Daily Change</th>
                <th>Remove</th>
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
                  <td
                    style={{
                      color:
                        stock.dayChangePercent >= 0 ? "limegreen" : "red",
                      fontWeight: "bold"
                    }}
                  >
                    {stock.dayChangePercent > 0 ? "+" : ""}
                    {stock.dayChangePercent}%
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
