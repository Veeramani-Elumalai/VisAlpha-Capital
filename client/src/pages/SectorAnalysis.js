import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import { useNavigate, useSearchParams } from "react-router-dom";

const SECTORS = ["Technology", "Finance", "Healthcare", "Consumer", "Energy", "Industrial"];

export default function SectorAnalysis() {
    const [sector, setSector] = useState("Technology");
    const [customSector, setCustomSector] = useState("");
    const [data, setData] = useState(null);
    const [sortedData, setSortedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: "marketCap", direction: "desc" });
    const navigate = useNavigate();

    const fetchSectorData = useCallback(async (sectorName) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`http://localhost:5000/api/sector/${sectorName}`);
            setData(res.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError("Sector not found. Please try another name.");
            } else {
                setError("Failed to fetch sector data. Ensure services are running.");
            }
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const querySector = searchParams.get("sector");
        if (querySector) {
            setSector(querySector);
            fetchSectorData(querySector);
        } else {
            fetchSectorData(sector);
        }
    }, [searchParams, fetchSectorData]);

    const sortArray = useCallback((arr, key, direction) => {
        const sorted = [...arr].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === "asc" ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === "asc" ? 1 : -1;
            }
            return 0;
        });
        setSortedData(sorted);
    }, []);

    // Sort whenever `data` or `sortConfig` changes
    useEffect(() => {
        if (data && data.stocks) {
            sortArray(data.stocks, sortConfig.key, sortConfig.direction);
        }
    }, [data, sortConfig, sortArray]);

    const handleSort = (key) => {
        let direction = "desc";
        if (sortConfig.key === key && sortConfig.direction === "desc") {
            direction = "asc";
        }
        setSortConfig({ key, direction });
        if (data) {
            sortArray(data.stocks, key, direction);
        }
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕️";
        return sortConfig.direction === "asc" ? "🔼" : "🔽";
    };

    if (!data && loading) return <div className="center"><h2>Loading Market Data...</h2></div>;

    const stats = data ? data.stats : {};

    return (
        <div className="dashboard">
            <header className="top-bar">
                <h2>🌐 Top Sector Metrics</h2>
                <a href="/dashboard" className="logout" style={{ textDecoration: "none", background: "#3b82f6" }}>
                    Back to Dashboard
                </a>
            </header>

            {/* ---------- Search & Filter ---------- */}
            <div className="add-box" style={{ marginTop: "20px", alignItems: "center", gap: "10px" }}>
                <h3 style={{ margin: 0 }}>Select Sector:</h3>
                <select
                    value={SECTORS.includes(sector) ? sector : ""}
                    onChange={(e) => {
                        setSector(e.target.value);
                        setCustomSector("");
                        fetchSectorData(e.target.value);
                    }}
                    style={{
                        padding: "10px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#1e293b",
                        color: "white",
                        fontSize: "16px",
                        minWidth: "150px"
                    }}
                >
                    <option value="" disabled>Select a Sector</option>
                    {SECTORS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <span>OR</span>

                <input
                    type="text"
                    placeholder="Search Custom Sector..."
                    value={customSector}
                    onChange={(e) => setCustomSector(e.target.value)}
                    style={{
                        padding: "10px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#1e293b",
                        color: "white",
                        fontSize: "16px",
                        minWidth: "150px"
                    }}
                />

                <button onClick={() => {
                    if (customSector) {
                        if (customSector.trim() === "") {
                            setError("Please enter a sector name");
                            return;
                        }
                        setSector(customSector);
                        fetchSectorData(customSector);
                    } else {
                        fetchSectorData(sector);
                    }
                }} style={{ background: "#22c55e" }}>
                    Search
                </button>
            </div>

            {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}

            {data && (
                <>
                    {/* ---------- Stats Cards ---------- */}
                    <div className="summary">
                        <div>
                            <h4>Avg PE Ratio</h4>
                            <p>{stats.avgPe}</p>
                        </div>
                        <div>
                            <h4>Top Performer</h4>
                            <p style={{ color: "#22c55e" }}>{stats.topStock} ({stats.topStockChange}%)</p>
                        </div>
                        <div>
                            <h4>Worst Performer</h4>
                            <p style={{ color: "#ef4444" }}>{stats.worstStock} ({stats.worstStockChange}%)</p>
                        </div>
                    </div>

                    {/* ---------- Charts Row ---------- */}
                    <div className="charts-row">
                        {/* Market Cap Distribution */}
                        <div className="chart small">
                            <h3>Market Cap Distribution (Billions)</h3>
                            <Pie
                                data={{
                                    labels: sortedData.map(s => s.symbol),
                                    datasets: [{
                                        data: sortedData.map(s => s.marketCap / 1e9),
                                        backgroundColor: ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#14b8a6", "#6366f1", "#ec4899"]
                                    }]
                                }}
                            />
                        </div>

                        {/* PE Comparison */}
                        <div className="chart small" style={{ width: "58%" }}>
                            <h3>P/E Ratio Comparison</h3>
                            <Bar
                                data={{
                                    labels: sortedData.map(s => s.symbol),
                                    datasets: [{
                                        label: "P/E Ratio",
                                        data: sortedData.map(s => s.peRatio),
                                        backgroundColor: "#3b82f6"
                                    }]
                                }}
                            />
                        </div>
                    </div>

                    {/* ---------- Data Table ---------- */}
                    <div className="table-container">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            <h3>{sector} Sector Leaders</h3>
                            <span style={{ fontSize: "12px", color: "gray" }}>Click headers to sort</span>
                        </div>

                        <table>
                            <thead>
                                <tr style={{ cursor: "pointer" }}>
                                    <th onClick={() => handleSort("symbol")}>Symbol {getSortIcon("symbol")}</th>
                                    <th onClick={() => handleSort("name")}>Name {getSortIcon("name")}</th>
                                    <th onClick={() => handleSort("price")}>Price {getSortIcon("price")}</th>
                                    <th onClick={() => handleSort("marketCap")}>M. Cap {getSortIcon("marketCap")}</th>
                                    <th onClick={() => handleSort("peRatio")}>P/E {getSortIcon("peRatio")}</th>
                                    <th onClick={() => handleSort("beta")}>Beta {getSortIcon("beta")}</th>
                                    <th onClick={() => handleSort("dividendYield")}>Div Yield {getSortIcon("dividendYield")}</th>
                                    <th onClick={() => handleSort("priceToBook")}>P/B {getSortIcon("priceToBook")}</th>
                                    <th onClick={() => handleSort("fiftyTwoWeekHigh")}>52W High {getSortIcon("fiftyTwoWeekHigh")}</th>
                                    <th onClick={() => handleSort("change")}>1D Change {getSortIcon("change")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map((stock) => (
                                    <tr
                                        key={stock.symbol}
                                        onClick={() => navigate(`/screener?query=${stock.symbol}`)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td><b>{stock.symbol}</b></td>
                                        <td>{stock.name}</td>
                                        <td>${stock.price?.toFixed(2)}</td>
                                        <td>${(stock.marketCap / 1e9).toFixed(2)}B</td>
                                        <td>{stock.peRatio?.toFixed(2)}</td>
                                        <td>{stock.beta?.toFixed(2)}</td>
                                        <td>{stock.dividendYield?.toFixed(2)}%</td>
                                        <td>{stock.priceToBook?.toFixed(2)}</td>
                                        <td>${stock.fiftyTwoWeekHigh?.toFixed(2)}</td>
                                        <td style={{ color: stock.change >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                                            {stock.change > 0 ? "+" : ""}{stock.change} ({stock.changePercent}%)
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
