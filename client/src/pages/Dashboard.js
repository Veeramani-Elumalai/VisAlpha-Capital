import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchPortfolio = async () => {
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

  if (loading)
    return (
      <div className="center">
        <h2>Loading Portfolio...</h2>
      </div>
    );

  return (
    <div className="dashboard">
      <header className="top-bar">
        <h2>📊 VisAlpha Portfolio</h2>
        <button onClick={handleLogout} className="logout">
          Logout
        </button>
      </header>

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
