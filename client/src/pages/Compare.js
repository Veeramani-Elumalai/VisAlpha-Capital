import { useState, useEffect } from "react";
import { getScreenerData } from "../services/screenerService";
import CompareInput from "../components/compare/CompareInput";
import SmallLineChart from "../components/compare/SmallLineChart";
import ComparisonRow from "../components/compare/ComparisonRow";
import { useNavigate } from "react-router-dom";

export default function Compare() {
    const [stockA, setStockA] = useState("");
    const [stockB, setStockB] = useState("");
    const [dataA, setDataA] = useState(null);
    const [dataB, setDataB] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Helper to compute Valuation Score (0-100)
    const calculateValuationScore = (data) => {
        if (!data) return 0;
        let score = 50; // Base score

        // P/E Score (Lower matches better)
        if (data.pe) {
            if (data.pe < 15) score += 10;
            else if (data.pe > 30) score -= 10;
        }

        // ROE Score (Higher matches better)
        if (data.roe) {
            if (data.roe > 0.15) score += 10;
            else if (data.roe < 0.05) score -= 10;
        }

        // Growth Score
        if (data.revenueCagr > 10) score += 5;
        if (data.profitCagr > 10) score += 5;

        // Debt Score
        if (data.debtToEquity && data.debtToEquity < 0.5) score += 10;
        else if (data.debtToEquity > 1.5) score -= 10;

        return Math.min(Math.max(score, 0), 100);
    };

    const handleCompare = async () => {
        if (!stockA || !stockB) return;
        setLoading(true);
        setError("");
        setDataA(null);
        setDataB(null);

        try {
            const [resA, resB] = await Promise.all([
                getScreenerData(stockA),
                getScreenerData(stockB)
            ]);

            if (!resA || !resB) throw new Error("One or both symbols are invalid.");

            setDataA({ ...resA, score: calculateValuationScore(resA) });
            setDataB({ ...resB, score: calculateValuationScore(resB) });

        } catch (err) {
            console.error(err);
            setError("Failed to fetch comparison data. Check stock symbols.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard" style={{ minHeight: "100vh", paddingBottom: "50px" }}>
            <header className="top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ color: "white", margin: 0 }}>⚖️ Stock Comparison</h2>
                <a href="/dashboard" className="logout" style={{ textDecoration: "none", background: "#3b82f6" }}>
                    Back
                </a>
            </header>

            <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>

                {/* Search Inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "20px", alignItems: "end", marginBottom: "30px" }}>
                    <CompareInput label="Stock A" symbol={stockA} setSymbol={setStockA} />
                    <CompareInput label="Stock B" symbol={stockB} setSymbol={setStockB} />
                    <button
                        onClick={handleCompare}
                        disabled={loading || !stockA || !stockB}
                        style={{ height: "46px", minWidth: "120px", background: "#22c55e", color: "white", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", border: "none" }}
                    >
                        {loading ? "..." : "Compare"}
                    </button>
                </div>

                {error && <div style={{ background: "#ef444420", color: "#ef4444", padding: "10px", borderRadius: "6px", marginBottom: "20px" }}>{error}</div>}

                {/* Comparison Content */}
                {dataA && dataB && (
                    <div className="comparison-container" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>

                        {/* 1. Header & Score Overview */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            {/* Stock A Card */}
                            <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "4px solid #3b82f6" }}>
                                <h2 style={{ margin: "0 0 5px 0", fontSize: "24px" }}>{dataA.symbol}</h2>
                                <p style={{ color: "#94a3b8", margin: 0 }}>{dataA.companyName}</p>
                                <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "14px", color: "#cbd5e1" }}>Valuation Score</span>
                                    <span style={{ fontSize: "20px", fontWeight: "bold", color: dataA.score >= 70 ? "#22c55e" : "#facc15" }}>{dataA.score}/100</span>
                                </div>
                                <div style={{ background: "#334155", height: "6px", borderRadius: "3px", marginTop: "5px", overflow: "hidden" }}>
                                    <div style={{ width: `${dataA.score}%`, background: dataA.score >= 70 ? "#22c55e" : "#facc15", height: "100%" }}></div>
                                </div>
                            </div>

                            {/* Stock B Card */}
                            <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "4px solid #ef4444" }}>
                                <h2 style={{ margin: "0 0 5px 0", fontSize: "24px" }}>{dataB.symbol}</h2>
                                <p style={{ color: "#94a3b8", margin: 0 }}>{dataB.companyName}</p>
                                <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "14px", color: "#cbd5e1" }}>Valuation Score</span>
                                    <span style={{ fontSize: "20px", fontWeight: "bold", color: dataB.score >= 70 ? "#22c55e" : "#facc15" }}>{dataB.score}/100</span>
                                </div>
                                <div style={{ background: "#334155", height: "6px", borderRadius: "3px", marginTop: "5px", overflow: "hidden" }}>
                                    <div style={{ width: `${dataB.score}%`, background: dataB.score >= 70 ? "#22c55e" : "#facc15", height: "100%" }}></div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Detailed Metrics Table */}
                        <div style={{ background: "#1e293b", borderRadius: "12px", overflow: "hidden" }}>
                            <div style={{ padding: "15px 20px", background: "#0f172a", borderBottom: "1px solid #334155", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                                <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>Metric</span>
                                <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", textAlign: "right" }}>{dataA.symbol}</span>
                                <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", textAlign: "right" }}>{dataB.symbol}</span>
                            </div>

                            <div style={{ padding: "0 20px" }}>
                                <ComparisonRow label="Sector" valueA={dataA.sector} valueB={dataB.sector} />
                                <ComparisonRow label="Market Cap" valueA={dataA.marketCap} valueB={dataB.marketCap} />
                                <ComparisonRow label="P/E Ratio" valueA={dataA.pe} valueB={dataB.pe} highBetter={false} format={v => v?.toFixed(2)} />
                                <ComparisonRow label="ROE" valueA={dataA.roe} valueB={dataB.roe} format={v => (v * 100).toFixed(2) + "%"} />
                                <ComparisonRow label="Debt / Equity" valueA={dataA.debtToEquity} valueB={dataB.debtToEquity} highBetter={false} format={v => v?.toFixed(2)} />
                                <ComparisonRow label="Rev. Growth (5Y)" valueA={dataA.revenueCagr} valueB={dataB.revenueCagr} format={v => v + "%"} />
                                <ComparisonRow label="Profit Growth (5Y)" valueA={dataA.profitCagr} valueB={dataB.profitCagr} format={v => v + "%"} />
                            </div>
                        </div>

                        {/* 3. Growth Charts Side-by-Side */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px" }}>
                                <h4 style={{ margin: "0 0 15px 0", color: "#94a3b8" }}>Revenue Trend ({dataA.symbol})</h4>
                                <SmallLineChart data={dataA.revenueSeries} label="Revenue" color="#3b82f6" />
                            </div>
                            <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px" }}>
                                <h4 style={{ margin: "0 0 15px 0", color: "#94a3b8" }}>Revenue Trend ({dataB.symbol})</h4>
                                <SmallLineChart data={dataB.revenueSeries} label="Revenue" color="#ef4444" />
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
