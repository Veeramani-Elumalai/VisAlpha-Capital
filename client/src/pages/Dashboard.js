import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import { Line } from "react-chartjs-2";

export default function Dashboard() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(() => {
    const cached = localStorage.getItem("portfolioCache");
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem("portfolioCache");
  });
  const [perf, setPerf] = useState(() => {
    const cached = localStorage.getItem("perfCache");
    return cached ? JSON.parse(cached) : [];
  });
  const [bench, setBench] = useState(() => {
    const cached = localStorage.getItem("benchCache");
    return cached ? JSON.parse(cached) : [];
  });
  const [range, setRange] = useState(30);
  const [benchmark, setBenchmark] = useState("^GSPC");

  const indices = [
    { name: "S&P 500", symbol: "^GSPC" },
    { name: "NASDAQ", symbol: "^IXIC" },
    { name: "Dow Jones", symbol: "^DJI" },
    { name: "Russell 2000", symbol: "^RUT" },
  ];


  // Add Stock Input States
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [adding, setAdding] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("portfolioCache");
    localStorage.removeItem("perfCache");
    localStorage.removeItem("benchCache");
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

        const stocks = res.data.stocks || [];
        setPortfolio(stocks);
        localStorage.setItem("portfolioCache", JSON.stringify(stocks));
      } catch (err) {
        alert("Session expired. Login again.");
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  useEffect(() => {
    const loadPerf = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/portfolio/performance?days=${range}&benchmark=${benchmark}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setPerf(res.data.portfolio);
        setBench(res.data.benchmark);
        localStorage.setItem("perfCache", JSON.stringify(res.data.portfolio));
        localStorage.setItem("benchCache", JSON.stringify(res.data.benchmark));
      } catch (e) {
        console.log("Performance fetch failed", e.message);
      }
    };

    loadPerf();
  }, [range, benchmark]);

  // Handle tooltip cleanup on unmount
  useEffect(() => {
    return () => {
      const tooltips = ["chartjs-tooltip", "sector-tooltip"];
      tooltips.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
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
  const customTooltip = {
    id: "customTooltip",
    beforeRender(chart, args, opts) {
      chart._activeElements = [];
    }
  };


  return (
    <div className="dashboard">
      <header className="top-bar">
        <h2>📊 VisAlpha Portfolio</h2>
        <button onClick={handleLogout} className="logout">
          Logout
        </button>
        <a href="/sector-analysis" className="logout" style={{ background: "#3b82f6", textDecoration: "none", marginLeft: "10px" }}>
          Sector Analysis
        </a>
        <a href="/screener" className="logout" style={{ background: "#a855f7", textDecoration: "none", marginLeft: "10px" }}>
          Screener
        </a>
        <a href="/news" className="logout" style={{ background: "#ea580c", textDecoration: "none", marginLeft: "10px" }}>
          Market News
        </a>
        <a href="/advisor" className="logout" style={{ background: "#2563eb", textDecoration: "none", marginLeft: "10px" }}>
          ✨ AI Advisor
        </a>
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
                onClick: (evt, elements) => {
                  if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const stock = portfolio[index];
                    const tooltipEl = document.getElementById("chartjs-tooltip");
                    if (tooltipEl) tooltipEl.style.opacity = 0;
                    navigate(`/screener?query=${stock.symbol}`);
                  }
                },
                plugins: {
                  tooltip: {
                    enabled: false,
                    external: (ctx) => {
                      let tooltipModel = ctx.tooltip;
                      let tooltipEl = document.getElementById("chartjs-tooltip");

                      if (!tooltipEl) {
                        tooltipEl = document.createElement("div");
                        tooltipEl.id = "chartjs-tooltip";
                        tooltipEl.style.position = "absolute";
                        tooltipEl.style.background = "rgba(0,0,0,.85)";
                        tooltipEl.style.color = "white";
                        tooltipEl.style.padding = "10px";
                        tooltipEl.style.borderRadius = "8px";
                        tooltipEl.style.pointerEvents = "none";
                        tooltipEl.style.fontSize = "14px";
                        document.body.appendChild(tooltipEl);
                      }

                      if (tooltipModel.opacity === 0) {
                        tooltipEl.style.opacity = 0;
                        return;
                      }

                      const index = tooltipModel.dataPoints[0].dataIndex;
                      const s = portfolio[index];

                      const invested = s.investedValue || 0;
                      const current = s.currentValue || 0;
                      const gain = current - invested;
                      const gainPercent =
                        invested > 0 ? ((gain / invested) * 100).toFixed(2) : 0;

                      tooltipEl.innerHTML = `
                        <div><b>${s.symbol}</b></div>
                        <div>Inv = $${invested.toFixed(2)}</div>
                        <div>Current = $${current.toFixed(2)}</div>
                        <div style="color:${gain >= 0 ? "limegreen" : "red"};">
                          ${gain >= 0 ? "Gain" : "Loss"} =
                          ${gain >= 0 ? "+" : ""}${gain.toFixed(2)}
                          (${gainPercent}%)
                        </div>`;

                      const canvasRect = ctx.chart.canvas.getBoundingClientRect();
                      tooltipEl.style.opacity = 1;
                      tooltipEl.style.left =
                        canvasRect.left + window.scrollX + tooltipModel.caretX + "px";
                      tooltipEl.style.top =
                        canvasRect.top + window.scrollY + tooltipModel.caretY + "px";
                    }
                  }
                }
              }}
              plugins={[customTooltip]}
              style={{ cursor: "pointer" }}
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
                onClick: (evt, elements) => {
                  if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const labels = [...new Set(portfolio.map(s => s.sector))];
                    const sector = labels[index];
                    const tooltipEl = document.getElementById("sector-tooltip");
                    if (tooltipEl) tooltipEl.style.opacity = 0;
                    navigate(`/sector-analysis?sector=${sector}`);
                  }
                },
                plugins: {
                  tooltip: {
                    enabled: false,
                    external: (ctx) => {
                      let tooltipModel = ctx.tooltip;
                      let tooltipEl = document.getElementById("sector-tooltip");

                      if (!tooltipEl) {
                        tooltipEl = document.createElement("div");
                        tooltipEl.id = "sector-tooltip";
                        tooltipEl.style.position = "absolute";
                        tooltipEl.style.background = "rgba(0,0,0,.85)";
                        tooltipEl.style.color = "white";
                        tooltipEl.style.padding = "10px";
                        tooltipEl.style.borderRadius = "8px";
                        tooltipEl.style.pointerEvents = "none";
                        tooltipEl.style.fontSize = "14px";
                        document.body.appendChild(tooltipEl);
                      }

                      if (tooltipModel.opacity === 0) {
                        tooltipEl.style.opacity = 0;
                        return;
                      }

                      const index = tooltipModel.dataPoints[0].dataIndex;
                      const sector = ctx.chart.data.labels[index];

                      const sectorStocks = portfolio.filter(s => s.sector === sector);

                      const invested = sectorStocks.reduce(
                        (t, s) => t + s.investedValue,
                        0
                      );

                      const current = sectorStocks.reduce(
                        (t, s) => t + s.currentValue,
                        0
                      );

                      const gain = current - invested;
                      const gainPercent =
                        invested > 0 ? ((gain / invested) * 100).toFixed(2) : 0;

                      tooltipEl.innerHTML = `
                        <div><b>${sector}</b></div>
                        <div>Inv = $${invested.toFixed(2)}</div>
                        <div>Current = $${current.toFixed(2)}</div>
                        <div style="color:${gain >= 0 ? "limegreen" : "red"};">
                          ${gain >= 0 ? "Gain" : "Loss"} =
                          ${gain >= 0 ? "+" : ""}${gain.toFixed(2)}
                          (${gainPercent}%)
                        </div>
                      `;

                      const canvasRect = ctx.chart.canvas.getBoundingClientRect();
                      tooltipEl.style.opacity = 1;
                      tooltipEl.style.left =
                        canvasRect.left + window.scrollX + tooltipModel.caretX + "px";
                      tooltipEl.style.top =
                        canvasRect.top + window.scrollY + tooltipModel.caretY + "px";
                    }
                  }
                }
              }}
              style={{ cursor: "pointer" }}
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
                  <td
                    onClick={() => navigate(`/screener?query=${stock.symbol}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {stock.symbol}
                  </td>
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

      {/* ---------- PERFORMANCE CHART ---------- */}
      {perf.length > 0 && (
        <div className="chart">

          {/* HEADER + RANGE BUTTONS */}
          <div style={{ display: "flex", justifyContent: "space-between", color: "white", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3>Portfolio vs</h3>
              <select
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                style={{
                  background: "#1e293b",
                  color: "white",
                  border: "1px solid #475569",
                  padding: "5px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {indices.map(idx => (
                  <option key={idx.symbol} value={idx.symbol}>{idx.name}</option>
                ))}
              </select>
            </div>

            <div>
              <button onClick={() => setRange(7)}>7D</button>
              <button onClick={() => setRange(30)}>1M</button>
              <button onClick={() => setRange(90)}>3M</button>
              <button onClick={() => setRange(365)}>1Y</button>
            </div>
          </div>

          {/* CHART */}
          <Line
            data={{
              labels: perf.map(p => p.date),

              datasets: [
                {
                  label: "Portfolio (%)",
                  data: perf.map(p => p.value),
                  borderColor: "#22c55e",
                  tension: 0.4,
                },
                {
                  label: `${indices.find(i => i.symbol === benchmark)?.name} (%)`,
                  data: bench.map(b => b.value),
                  borderColor: "#3b82f6",
                  tension: 0.4,
                }
              ]
            }}
          />

          {/* RETURN STATS */}
          <div style={{ color: "white", marginTop: "10px" }}>
            <p>
              Portfolio Return:
              <b style={{ color: perf.at(-1).value >= 100 ? "limegreen" : "red" }}>
                {(perf.at(-1).value - 100).toFixed(2)}%
              </b>
            </p>

            <p>
              {indices.find(i => i.symbol === benchmark)?.name} Return:
              <b style={{ color: bench.at(-1)?.value >= 100 ? "limegreen" : "red" }}>
                {(bench.at(-1)?.value - 100).toFixed(2)}%
              </b>
            </p>

            <p>
              Outperformance:
              <b style={{ color: (perf.at(-1).value - bench.at(-1).value) >= 0 ? "limegreen" : "red" }}>
                {(perf.at(-1).value - bench.at(-1).value).toFixed(2)}%
              </b>
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
