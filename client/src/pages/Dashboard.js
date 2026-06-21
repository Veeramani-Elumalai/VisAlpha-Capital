import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearUserSession, getCurrentUserId } from "../services/api";
import { Pie, Line } from "react-chartjs-2";
import "chart.js/auto";

// ── Cache key helpers (namespaced by userId) ──────────────────────
function cacheKey(userId, ...parts) {
  return `${userId}_${parts.join("_")}`;
}

function readCache(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function writeCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function cacheIsValid(timeKey, maxAgeMs = 120000) {
  const t = localStorage.getItem(timeKey);
  return t && (Date.now() - parseInt(t) < maxAgeMs);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perf, setPerf] = useState([]);
  const [bench, setBench] = useState([]);
  const [perfLoading, setPerfLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [benchmark, setBenchmark] = useState("^GSPC");
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [toast, setToast] = useState(null);

  const indices = [
    { name: "S&P 500", symbol: "^GSPC" },
    { name: "NASDAQ", symbol: "^IXIC" },
    { name: "Dow Jones", symbol: "^DJI" },
    { name: "Russell 2000", symbol: "^RUT" },
  ];

  // ── Toast helper ──────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    clearUserSession();
    window.location.href = "/login";
  }, []);

  // ── Fetch Portfolio ───────────────────────────────────────────
  const fetchPortfolio = useCallback(async (force = false) => {
    if (!userId) { handleLogout(); return; }

    const ck = cacheKey(userId, "portfolio");
    const tk = cacheKey(userId, "portfolioTime");

    if (!force && cacheIsValid(tk)) {
      const cached = readCache(ck);
      if (cached) { setPortfolio(cached); setLoading(false); return; }
    }

    try {
      const res = await api.get("/api/portfolio");
      const stocks = res.data.stocks || [];
      setPortfolio(stocks);
      writeCache(ck, stocks);
      localStorage.setItem(tk, Date.now().toString());
    } catch (err) {
      if (err.response?.status !== 401) {
        showToast("Failed to load portfolio", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, handleLogout]);

  // ── Fetch Performance ─────────────────────────────────────────
  const fetchPerf = useCallback(async (force = false) => {
    if (!userId) return;
    setPerfLoading(true);

    const pk = cacheKey(userId, "perf", range, benchmark);
    const bk = cacheKey(userId, "bench", range, benchmark);
    const tk = cacheKey(userId, "perfTime", range, benchmark);

    if (!force && cacheIsValid(tk)) {
      const cp = readCache(pk);
      const cb = readCache(bk);
      if (cp && cb) {
        setPerf(cp);
        setBench(cb);
        setPerfLoading(false);
        return;
      }
    }

    try {
      const res = await api.get(
        `/api/portfolio/performance?days=${range}&benchmark=${benchmark}`
      );
      const pData = res.data.portfolio || [];
      const bData = res.data.benchmark || [];
      setPerf(pData);
      setBench(bData);
      writeCache(pk, pData);
      writeCache(bk, bData);
      localStorage.setItem(tk, Date.now().toString());
    } catch (e) {
      console.log("Performance fetch failed", e.message);
    } finally {
      setPerfLoading(false);
    }
  }, [userId, range, benchmark]);

  // ── Fetch Daily Report Alerts ─────────────────────────────────
  const fetchAlerts = useCallback(async (stocks) => {
    if (!stocks || stocks.length === 0) return;
    try {
      const res = await api.get("/api/daily-report");
      if (!res.data.hasPortfolio) return;
      const allSignals = [
        ...(res.data.positiveSignals || []),
        ...(res.data.negativeSignals || []),
      ];
      const heldSymbols = stocks.map((s) => s.symbol);
      const matching = allSignals.filter((sig) => heldSymbols.includes(sig.stock));
      if (matching.length > 0) setAlerts(matching);
    } catch (e) {
      console.log("Daily report check failed", e.message);
    }
  }, []);

  // ── Effects ───────────────────────────────────────────────────
  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);
  useEffect(() => { fetchPerf(); }, [fetchPerf]);
  useEffect(() => {
    return () => {
      ["chartjs-tooltip", "sector-tooltip"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, []);

  // Run alert check after portfolio loads
  useEffect(() => {
    if (portfolio.length > 0) fetchAlerts(portfolio);
  }, [portfolio, fetchAlerts]);

  // ── Add Stock ─────────────────────────────────────────────────
  const addStock = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/api/portfolio/add", {
        symbol,
        quantity: Number(qty),
        buyPrice: Number(price),
      });
      showToast(`${symbol} added successfully!`);
      setSymbol("");
      setQty("");
      setPrice("");
      // Refresh portfolio state without full page reload
      await fetchPortfolio(true);
      await fetchPerf(true);
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to add stock", "error");
    } finally {
      setAdding(false);
    }
  };

  // ── Remove Stock ──────────────────────────────────────────────
  const removeStock = async (sym) => {
    if (!window.confirm(`Remove ${sym} from your portfolio?`)) return;
    try {
      await api.delete(`/api/portfolio/remove/${sym}`);
      showToast(`${sym} removed`);
      // Update state without reload
      const updated = portfolio.filter((s) => s.symbol !== sym);
      setPortfolio(updated);
      writeCache(cacheKey(userId, "portfolio"), updated);
      await fetchPerf(true);
    } catch {
      showToast("Failed to remove stock", "error");
    }
  };

  // ── Derived values ────────────────────────────────────────────
  const investedTotal = portfolio.reduce((t, s) => t + s.investedValue, 0);
  const currentTotal = portfolio.reduce((t, s) => t + s.currentValue, 0);
  const profitTotal = currentTotal - investedTotal;
  const profitPercent = investedTotal > 0 ? ((profitTotal / investedTotal) * 100).toFixed(2) : 0;
  const dailyChangeTotal = portfolio.reduce((t, s) => t + s.dayChange * s.quantity, 0);
  const dailyChangePercent = currentTotal > 0 ? ((dailyChangeTotal / currentTotal) * 100).toFixed(2) : 0;

  const customTooltip = {
    id: "customTooltip",
    beforeRender(chart) { chart._activeElements = []; }
  };

  const userName = localStorage.getItem("userName");

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="center">
        <div className="spinner" style={{ border: "4px solid #1e293b", borderTop: "4px solid #3b82f6", borderRadius: "50%", width: "48px", height: "48px", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        <p style={{ color: "#64748b", marginTop: "16px" }}>Loading your portfolio…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ── Toast Notification ── */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          backgroundColor: toast.type === "error" ? "#ef4444" : "#22c55e",
          color: "white", padding: "14px 20px", borderRadius: "10px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)", fontWeight: "600",
          animation: "slideDown 0.3s ease", fontSize: "14px"
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Top Navigation Bar ── */}
      <header className="top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ margin: 0 }}>📊 VisAlpha</h2>
          {userName && (
            <span style={{ color: "#64748b", fontSize: "14px" }}>
              Welcome back, <span style={{ color: "#f1f5f9", fontWeight: "600" }}>{userName}</span>
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <a href="/sector-analysis" className="logout" style={{ background: "#3b82f6", textDecoration: "none" }}>Sector Analysis</a>
          <a href="/screener" className="logout" style={{ background: "#a855f7", textDecoration: "none" }}>Screener</a>
          <a href="/news" className="logout" style={{ background: "#ea580c", textDecoration: "none" }}>News</a>
          <a href="/daily-report" className="logout" style={{ background: "#8b5cf6", textDecoration: "none" }}>📅 Daily Report</a>
          <a href="/advisor" className="logout" style={{ background: "#2563eb", textDecoration: "none" }}>✨ AI Advisor</a>
          <button onClick={handleLogout} className="logout">Logout</button>
        </div>
      </header>

      {/* ── AI Alert Banner ── */}
      {alerts.length > 0 && (
        <div
          className="report-alert-unified"
          onClick={() => navigate("/daily-report")}
          style={{
            cursor: "pointer", backgroundColor: "#1e293b",
            border: "1px solid #3b82f6", borderRadius: "16px",
            padding: "20px", marginBottom: "28px",
            display: "flex", alignItems: "flex-start", gap: "16px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            animation: "slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ backgroundColor: "#3b82f6", borderRadius: "12px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>🚀</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#f8fafc", fontSize: "18px" }}>
              AI Market Alert: {alerts.length} action item{alerts.length > 1 ? "s" : ""} in your portfolio
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {alerts.slice(0, 3).map((alert, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                  <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "12px", padding: "2px 6px", backgroundColor: "rgba(34,197,94,0.1)", borderRadius: "4px", minWidth: "50px", textAlign: "center" }}>
                    {alert.stock}
                  </span>
                  <p style={{ margin: 0, color: "#cbd5e1", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {alert.headline}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ margin: "12px 0 0 0", color: "#3b82f6", fontSize: "13px", fontWeight: "600" }}>Click to view full AI Analysis →</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setAlerts([]); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "24px", padding: "0", lineHeight: "1" }}>&times;</button>
        </div>
      )}

      {/* ── P/L Summary Cards ── */}
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
            {dailyChangeTotal >= 0 ? "+" : ""}{dailyChangeTotal.toFixed(2)} ({dailyChangePercent}%)
          </p>
        </div>
        <div>
          <h4>Overall Gain %</h4>
          <p style={{ color: profitTotal >= 0 ? "limegreen" : "red" }}>{profitPercent}%</p>
        </div>
      </div>

      {/* ── Add Stock Form ── */}
      <form className="add-box" onSubmit={addStock}>
        <input type="text" placeholder="Symbol e.g AAPL" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required />
        <input type="number" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} required />
        <input type="number" placeholder="Buy Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <button type="submit" disabled={adding}>{adding ? "Adding..." : "Add Stock"}</button>
      </form>

      {/* ── Portfolio Table ── */}
      {portfolio.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", border: "1px dashed #334155", borderRadius: "16px", margin: "0 0 28px 0" }}>
          <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📭</p>
          <p style={{ color: "#94a3b8", fontSize: "18px", fontWeight: "600" }}>Your portfolio is empty</p>
          <p style={{ color: "#64748b", fontSize: "14px" }}>Add your first stock above to start tracking performance and get AI-powered insights.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Stock</th><th>Qty</th><th>Buy Price</th><th>Current Price</th><th>P/L (%)</th><th>Daily Change</th><th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((stock, i) => (
                <tr key={i}>
                  <td onClick={() => navigate(`/screener?query=${stock.symbol}`)} style={{ cursor: "pointer" }}>{stock.symbol}</td>
                  <td>{stock.quantity}</td>
                  <td>${stock.buyPrice?.toFixed(2)}</td>
                  <td>${stock.currentPrice?.toFixed(2)}</td>
                  <td style={{ color: stock.profitLoss >= 0 ? "limegreen" : "red", fontWeight: "bold" }}>{stock.profitLossPercent}%</td>
                  <td style={{ color: stock.dayChangePercent >= 0 ? "limegreen" : "red", fontWeight: "bold" }}>
                    {stock.dayChangePercent > 0 ? "+" : ""}{stock.dayChangePercent}%
                  </td>
                  <td><button onClick={() => removeStock(stock.symbol)} className="remove">❌</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pie Charts (only if portfolio has stocks) ── */}
      {portfolio.length > 0 && (
        <div className="charts-row">
          <div className="chart small">
            <h3 style={{ color: "white" }}>Holdings Allocation</h3>
            <Pie
              data={{ labels: portfolio.map((s) => s.symbol), datasets: [{ data: portfolio.map((s) => s.currentValue), backgroundColor: ["#22c55e","#3b82f6","#eab308","#ef4444","#a855f7","#14b8a6","#f97316"] }] }}
              options={{
                onClick: (evt, elements) => { if (elements?.length > 0) { document.getElementById("chartjs-tooltip")?.style && (document.getElementById("chartjs-tooltip").style.opacity = 0); navigate(`/screener?query=${portfolio[elements[0].index].symbol}`); } },
                plugins: {
                  tooltip: {
                    enabled: false,
                    external: (ctx) => {
                      let el = document.getElementById("chartjs-tooltip");
                      if (!el) { el = document.createElement("div"); el.id = "chartjs-tooltip"; el.style.cssText = "position:absolute;background:rgba(0,0,0,.85);color:white;padding:10px;border-radius:8px;pointer-events:none;font-size:14px;"; document.body.appendChild(el); }
                      if (ctx.tooltip.opacity === 0) { el.style.opacity = 0; return; }
                      const s = portfolio[ctx.tooltip.dataPoints[0].dataIndex];
                      const gain = s.currentValue - s.investedValue;
                      el.innerHTML = `<div><b>${s.symbol}</b></div><div>Inv = $${s.investedValue.toFixed(2)}</div><div>Current = $${s.currentValue.toFixed(2)}</div><div style="color:${gain >= 0 ? "limegreen" : "red"}">${gain >= 0 ? "+" : ""}${gain.toFixed(2)} (${s.profitLossPercent}%)</div>`;
                      const r = ctx.chart.canvas.getBoundingClientRect();
                      el.style.opacity = 1; el.style.left = r.left + window.scrollX + ctx.tooltip.caretX + "px"; el.style.top = r.top + window.scrollY + ctx.tooltip.caretY + "px";
                    }
                  }
                }
              }}
              plugins={[customTooltip]}
              style={{ cursor: "pointer" }}
            />
          </div>

          <div className="chart small">
            <h3 style={{ color: "white" }}>Sector Allocation</h3>
            <Pie
              data={{ labels: [...new Set(portfolio.map((s) => s.sector))], datasets: [{ data: [...new Set(portfolio.map((s) => s.sector))].map((sec) => portfolio.filter((s) => s.sector === sec).reduce((t, s) => t + s.currentValue, 0)), backgroundColor: ["#3b82f6","#22c55e","#eab308","#f43f5e","#a855f7","#06b6d4"] }] }}
              options={{
                onClick: (evt, elements) => { if (elements?.length > 0) { const labels = [...new Set(portfolio.map((s) => s.sector))]; navigate(`/sector-analysis?sector=${labels[elements[0].index]}`); } },
                plugins: { tooltip: { enabled: true } }
              }}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>
      )}

      {/* ── Performance vs Benchmark Chart (ALWAYS VISIBLE) ── */}
      <div className="chart">
        <div style={{ display: "flex", justifyContent: "space-between", color: "white", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ margin: 0 }}>Portfolio vs</h3>
            <select value={benchmark} onChange={(e) => setBenchmark(e.target.value)} style={{ background: "#1e293b", color: "white", border: "1px solid #475569", padding: "5px", borderRadius: "4px", cursor: "pointer" }}>
              {indices.map((idx) => (<option key={idx.symbol} value={idx.symbol}>{idx.name}</option>))}
            </select>
          </div>
          <div>
            {[7, 30, 90, 365].map((d, _, arr) => (
              <button key={d} onClick={() => setRange(d)} style={{ marginLeft: "4px", backgroundColor: range === d ? "#3b82f6" : undefined }}>
                {["7D","1M","3M","1Y"][arr.indexOf(d)]}
              </button>
            ))}
          </div>
        </div>

        {perfLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading benchmark data…</div>
        ) : bench.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Benchmark data unavailable. Ensure the market service is running.</div>
        ) : (
          <>
            <Line
              data={{
                labels: bench.map((b) => b.date),
                datasets: [
                  ...(perf.length > 0 ? [{
                    label: "Your Portfolio (%)",
                    data: perf.map((p) => p.value),
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34,197,94,0.05)",
                    tension: 0.4,
                    fill: true,
                  }] : []),
                  {
                    label: `${indices.find((i) => i.symbol === benchmark)?.name} (%)`,
                    data: bench.map((b) => b.value),
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.05)",
                    tension: 0.4,
                    fill: true,
                  },
                ],
              }}
            />

            {portfolio.length === 0 && (
              <div style={{ marginTop: "16px", padding: "14px 18px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>💡</span>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
                  Add stocks to your portfolio to see how your investments compare against the {indices.find((i) => i.symbol === benchmark)?.name}.
                </p>
              </div>
            )}

            <div style={{ color: "white", marginTop: "16px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {perf.length > 0 && (
                <p>Portfolio Return: <b style={{ color: perf.at(-1)?.value >= 100 ? "limegreen" : "red" }}>{(perf.at(-1).value - 100).toFixed(2)}%</b></p>
              )}
              <p>{indices.find((i) => i.symbol === benchmark)?.name} Return: <b style={{ color: bench.at(-1)?.value >= 100 ? "limegreen" : "red" }}>{bench.length > 0 ? (bench.at(-1)?.value - 100).toFixed(2) : "0.00"}%</b></p>
              {perf.length > 0 && bench.length > 0 && (
                <p>Outperformance: <b style={{ color: (perf.at(-1)?.value - bench.at(-1)?.value) >= 0 ? "limegreen" : "red" }}>{(perf.at(-1).value - bench.at(-1).value).toFixed(2)}%</b></p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
