import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import { useNavigate, useSearchParams } from "react-router-dom";

const SECTORS = [
    "Technology",
    "Finance",
    "Healthcare",
    "Consumer",
    "Energy",
    "Industrial",
    "Communication",
    "Utilities",
    "Materials",
    "Real Estate",
    "Consumer Defensive"
];

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

    // Industry State
    const [expandedIndustries, setExpandedIndustries] = useState(new Set());
    const [industrySortConfig, setIndustrySortConfig] = useState({ key: "totalMarketCap", direction: "desc" });
    const [sortedIndustries, setSortedIndustries] = useState([]);

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

    // Sort industries whenever data or industrySortConfig changes
    useEffect(() => {
        if (data && data.industries) {
            const sorted = [...data.industries].sort((a, b) => {
                const key = industrySortConfig.key;
                const direction = industrySortConfig.direction;
                if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
                if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
                return 0;
            });
            setSortedIndustries(sorted);
        }
    }, [data, industrySortConfig]);

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

    const handleIndustrySort = (key) => {
        let direction = "desc";
        if (industrySortConfig.key === key && industrySortConfig.direction === "desc") {
            direction = "asc";
        }
        setIndustrySortConfig({ key, direction });
    };

    const getIndustrySortIcon = (key) => {
        if (industrySortConfig.key !== key) return "↕️";
        return industrySortConfig.direction === "asc" ? "🔼" : "🔽";
    };

    const toggleIndustry = (industryName) => {
        setExpandedIndustries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(industryName)) {
                newSet.delete(industryName);
            } else {
                newSet.add(industryName);
            }
            return newSet;
        });
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
                            <h4>Total Stocks</h4>
                            <p>{data.stocks?.length || 0}</p>
                        </div>
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
                            <h3>Top 10 Market Cap Distribution (Billions)</h3>
                            <Pie
                                data={{
                                    labels: [...sortedData].sort((a, b) => b.marketCap - a.marketCap).slice(0, 10).map(s => s.symbol),
                                    datasets: [{
                                        data: [...sortedData].sort((a, b) => b.marketCap - a.marketCap).slice(0, 10).map(s => s.marketCap / 1e9),
                                        backgroundColor: ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#14b8a6", "#6366f1", "#ec4899"]
                                    }]
                                }}
                            />
                        </div>

                        {/* PE Comparison */}
                        <div className="chart small" style={{ width: "58%" }}>
                            <h3>Top 10 P/E Ratio Comparison</h3>
                            <Bar
                                data={{
                                    labels: [...sortedData].sort((a, b) => b.marketCap - a.marketCap).slice(0, 10).map(s => s.symbol),
                                    datasets: [{
                                        label: "P/E Ratio",
                                        data: [...sortedData].sort((a, b) => b.marketCap - a.marketCap).slice(0, 10).map(s => s.peRatio),
                                        backgroundColor: "#3b82f6"
                                    }]
                                }}
                            />
                        </div>
                    </div>

                    {/* ---------- Industry Overview ---------- */}
                    {data.industries && data.industries.length > 0 && (
                        <div className="table-container" style={{ marginTop: "30px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                <h3>📊 Industry Breakdown</h3>
                                <span style={{ fontSize: "12px", color: "gray" }}>Click industry to expand stocks • Click headers to sort</span>
                            </div>

                            <table>
                                <thead>
                                    <tr style={{ cursor: "pointer" }}>
                                        <th style={{ width: "40px" }}></th>
                                        <th onClick={() => handleIndustrySort("name")}>Industry {getIndustrySortIcon("name")}</th>
                                        <th onClick={() => handleIndustrySort("stockCount")}>Stocks {getIndustrySortIcon("stockCount")}</th>
                                        <th onClick={() => handleIndustrySort("avgPe")}>Avg P/E {getIndustrySortIcon("avgPe")}</th>
                                        <th onClick={() => handleIndustrySort("totalMarketCap")}>Total M.Cap {getIndustrySortIcon("totalMarketCap")}</th>
                                        <th onClick={() => handleIndustrySort("avgBeta")}>Avg Beta {getIndustrySortIcon("avgBeta")}</th>
                                        <th onClick={() => handleIndustrySort("avgDividendYield")}>Avg Div Yield {getIndustrySortIcon("avgDividendYield")}</th>
                                        <th onClick={() => handleIndustrySort("topStockChange")}>Top Performer {getIndustrySortIcon("topStockChange")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedIndustries.map((industry) => (
                                        <>
                                            <tr
                                                key={industry.name}
                                                onClick={() => toggleIndustry(industry.name)}
                                                style={{
                                                    cursor: "pointer",
                                                    background: expandedIndustries.has(industry.name) ? "#1e293b" : "transparent",
                                                    borderLeft: expandedIndustries.has(industry.name) ? "3px solid #3b82f6" : "none"
                                                }}
                                            >
                                                <td style={{ textAlign: "center" }}>
                                                    {expandedIndustries.has(industry.name) ? "🔽" : "▶️"}
                                                </td>
                                                <td><b>{industry.name}</b></td>
                                                <td>{industry.stockCount}</td>
                                                <td>{industry.avgPe?.toFixed(2)}</td>
                                                <td>${(industry.totalMarketCap / 1e9).toFixed(2)}B</td>
                                                <td>{industry.avgBeta?.toFixed(2)}</td>
                                                <td>{industry.avgDividendYield?.toFixed(2)}%</td>
                                                <td style={{ color: industry.topStockChange >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                                                    {industry.topStock} ({industry.topStockChange > 0 ? "+" : ""}{industry.topStockChange}%)
                                                </td>
                                            </tr>
                                            {expandedIndustries.has(industry.name) && (
                                                <tr key={`${industry.name}-expanded`}>
                                                    <td colSpan="8" style={{ padding: "0", background: "#0f172a" }}>
                                                        <div style={{ padding: "20px", borderLeft: "3px solid #3b82f6" }}>
                                                            <h4 style={{ marginTop: 0, color: "#3b82f6" }}>Stocks in {industry.name}</h4>
                                                            <table style={{ width: "100%", marginTop: "10px" }}>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Symbol</th>
                                                                        <th>Name</th>
                                                                        <th>Price</th>
                                                                        <th>M. Cap</th>
                                                                        <th>P/E</th>
                                                                        <th>Beta</th>
                                                                        <th>Div Yield</th>
                                                                        <th>1D Change</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {industry.stocks.map((stock) => (
                                                                        <tr
                                                                            key={stock.symbol}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                navigate(`/screener?query=${stock.symbol}`);
                                                                            }}
                                                                            style={{ cursor: "pointer", background: "#1e293b" }}
                                                                        >
                                                                            <td><b>{stock.symbol}</b></td>
                                                                            <td>{stock.name}</td>
                                                                            <td>${stock.price?.toFixed(2)}</td>
                                                                            <td>${(stock.marketCap / 1e9).toFixed(2)}B</td>
                                                                            <td>{stock.peRatio?.toFixed(2)}</td>
                                                                            <td>{stock.beta?.toFixed(2)}</td>
                                                                            <td>{stock.dividendYield?.toFixed(2)}%</td>
                                                                            <td style={{ color: stock.change >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                                                                                {stock.change > 0 ? "+" : ""}{stock.change} ({stock.changePercent}%)
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

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
