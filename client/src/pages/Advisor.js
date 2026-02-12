import React, { useState } from "react";
import api from "../services/api";
import AdvisorCard from "../components/advisor/AdvisorCard";

const Advisor = () => {
    const [symbol, setSymbol] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!symbol) {
            setError("Please enter a stock symbol");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await api.get(`/api/stocks/advisor/${symbol}`);
            setResult(response.data);
        } catch (err) {
            console.error("Analysis failed:", err);
            setError(err.response?.data?.reason || "Failed to analyze stock. Please check the symbol and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="advisor-page" style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <a
                    href="/dashboard"
                    className="logout"
                    style={{
                        textDecoration: "none",
                        background: "#0077ffff",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        padding: "8px 16px",
                        color: "white",
                        borderRadius: "6px"
                    }}
                >
                    ← Back to Dashboard
                </a>
                <h1 style={{ margin: 0, flex: 1, textAlign: "center", marginRight: "160px", color: "#ffffffff" }}>AI Investment Advisor</h1>
            </div>

            <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "2rem" }}>
                <form onSubmit={handleAnalyze} style={{ display: "flex", gap: "1rem" }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Enter Stock Symbol (e.g., AAPL, RELIANCE.NS)"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "0.75rem 2rem",
                            borderRadius: "8px",
                            backgroundColor: "#2563eb",
                            color: "white",
                            fontWeight: "bold",
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1,
                            transition: "background-color 0.2s"
                        }}
                    >
                        {loading ? "Analyzing..." : "Analyze Stock"}
                    </button>
                </form>
            </div>

            {error && (
                <div style={{ padding: "1rem", backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", marginBottom: "2rem", textAlign: "center" }}>
                    {error}
                </div>
            )}

            {loading && (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="spinner" style={{ border: "4px solid rgba(0,0,0,0.1)", width: "36px", height: "36px", borderRadius: "50%", borderLeftColor: "#2563eb", animation: "spin 1s linear infinite", display: "inline-block" }}></div>
                    <p style={{ marginTop: "1rem", color: "#6b7280" }}>Generating investment verdict. This may take a few seconds...</p>
                    <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
                </div>
            )}

            {result && <AdvisorCard data={result} />}
        </div>
    );
};

export default Advisor;
