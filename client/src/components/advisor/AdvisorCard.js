import React from "react";
import VerdictBadge from "./VerdictBadge";

const AdvisorCard = ({ data }) => {
    if (!data) return null;

    return (
        <div className="advisor-card" style={{ marginTop: "2rem", padding: "2rem", border: "1px solid #e5e7eb", borderRadius: "12px", background: "white", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#111827" }}>Investment Verdict for {data.symbol}</h2>
                    <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>VisAlpha AI deterministic analysis engine</p>
                </div>
                <VerdictBadge verdict={data.verdict} />
            </div>

            <div style={{ marginBottom: "2rem", textAlign: "center", padding: "1.5rem", background: "#f9fafb", borderRadius: "8px" }}>
                <div style={{ fontSize: "3.5rem", fontWeight: "800", color: "#111827" }}>{data.confidence}%</div>
                <div style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.1em" }}>System Confidence Score</div>
                <div style={{ width: "100%", height: "10px", backgroundColor: "#e5e7eb", borderRadius: "5px", marginTop: "1rem", overflow: "hidden" }}>
                    <div style={{ width: `${data.confidence}%`, height: "100%", backgroundColor: data.verdict === "BUY" ? "#10b981" : data.verdict === "HOLD" ? "#f59e0b" : "#ef4444", borderRadius: "5px", transition: "width 1s ease-in-out" }}></div>
                </div>
            </div>

            <div style={{ marginBottom: "2.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", color: "#111827", marginBottom: "0.75rem", borderLeft: "4px solid #3b82f6", paddingLeft: "0.75rem" }}>AI Analysis Synthesis</h3>
                <p style={{ fontSize: "1.05rem", lineHeight: "1.7", color: "#374151", fontStyle: "italic" }}>"{data.summary}"</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2.5rem" }}>
                <div>
                    <h4 style={{ color: "#047857", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>📈</span> Insight Catalysts
                    </h4>
                    <ul style={{ paddingLeft: "1.2rem", color: "#374151", margin: 0 }}>
                        {data.catalysts && data.catalysts.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>{item}</li>
                        ))}
                        {(!data.catalysts || data.catalysts.length === 0) && <li style={{ color: "#9ca3af" }}>No major catalysts identified.</li>}
                    </ul>
                </div>
                <div>
                    <h4 style={{ color: "#b91c1c", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>⚠️</span> Logic Concerns
                    </h4>
                    <ul style={{ paddingLeft: "1.2rem", color: "#374151", margin: 0 }}>
                        {data.concerns && data.concerns.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>{item}</li>
                        ))}
                        {(!data.concerns || data.concerns.length === 0) && <li style={{ color: "#9ca3af" }}>No structural concerns detected.</li>}
                    </ul>
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: "1.25rem", color: "#111827", marginBottom: "1rem" }}>Underlying Financial Metrics</h3>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb" }}>
                                <th style={{ textAlign: "left", padding: "1rem", color: "#4b5563", fontSize: "0.875rem", textTransform: "uppercase" }}>Financial Metric</th>
                                <th style={{ textAlign: "right", padding: "1rem", color: "#4b5563", fontSize: "0.875rem", textTransform: "uppercase" }}>Detected Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid #f3f4f6" }}>Valuation Health Score</td>
                                <td style={{ textAlign: "right", padding: "1rem", borderBottom: "1px solid #f3f4f6", fontWeight: "bold" }}>{data.metricsUsed.valuationScore}/100</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid #f3f4f6" }}>Revenue CAGR (5-Year Window)</td>
                                <td style={{ textAlign: "right", padding: "1rem", borderBottom: "1px solid #f3f4f6", fontWeight: "bold" }}>{data.metricsUsed.revenueCagr}%</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid #f3f4f6" }}>Profit CAGR (5-Year Window)</td>
                                <td style={{ textAlign: "right", padding: "1rem", borderBottom: "1px solid #f3f4f6", fontWeight: "bold" }}>{data.metricsUsed.profitCagr}%</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid #f3f4f6" }}>Efficiency: Ret. on Equity (ROE)</td>
                                <td style={{ textAlign: "right", padding: "1rem", borderBottom: "1px solid #f3f4f6", fontWeight: "bold" }}>{(data.metricsUsed.roe * 100).toFixed(2)}%</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid #f3f4f6" }}>Leverage: Debt to Equity</td>
                                <td style={{ textAlign: "right", padding: "1rem", borderBottom: "1px solid #f3f4f6", fontWeight: "bold" }}>{data.metricsUsed.debtToEquity?.toFixed(2) || "N/A"}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid #f3f4f6" }}>P/E Ratio (Relative)</td>
                                <td style={{ textAlign: "right", padding: "1rem", borderBottom: "1px solid #f3f4f6", fontWeight: "bold" }}>{data.metricsUsed.pe?.toFixed(2) || "N/A"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdvisorCard;
