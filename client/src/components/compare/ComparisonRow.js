import React from "react";

const ComparisonRow = ({ label, valueA, valueB, format = (v) => v, highBetter = true }) => {
    const isBetter = (val, other) => {
        if (val === undefined || other === undefined || val === null || other === null) return false;
        // For P/E, Debt/Equity, lower is usually better (if highBetter is false)
        if (!highBetter) return val < other;
        return val > other;
    };

    const getStyle = (val, other) => {
        if (val === other) return { color: "#fff" };
        return isBetter(val, other) ? { color: "#22c55e", fontWeight: "bold" } : { color: "#fff" };
    };

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            padding: "12px 16px",
            borderBottom: "1px solid #334155",
            alignItems: "center"
        }}>
            {/* Metric Label */}
            <div style={{ color: "#94a3b8", fontSize: "14px", fontWeight: "500" }}>{label}</div>

            {/* Value A */}
            <div style={{ textAlign: "right", paddingRight: "20px", ...getStyle(valueA, valueB) }}>
                {valueA !== undefined && valueA !== null ? format(valueA) : "-"}
            </div>

            {/* Value B */}
            <div style={{ textAlign: "right", ...getStyle(valueB, valueA) }}>
                {valueB !== undefined && valueB !== null ? format(valueB) : "-"}
            </div>
        </div>
    );
};

export default ComparisonRow;
