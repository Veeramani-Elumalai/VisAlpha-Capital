import React from "react";

const CompareMetricsCard = ({ title, valueA, valueB, format = (v) => v, colorSuccess = false }) => {
    const getColor = (valA, valB) => {
        if (!colorSuccess) return "#fff";
        if (valA > valB) return "#22c55e"; // Green
        if (valA < valB) return "#ef4444"; // Red
        return "#fff";
    };

    return (
        <div className="summary-card" style={{ padding: "15px", background: "#1e293b", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "5px" }}>
            <h4 style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>{title}</h4>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "bold", color: getColor(valueA, valueB) }}>
                    {valueA !== undefined && valueA !== null ? format(valueA) : "-"}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>vs</span>
                <span style={{ fontSize: "16px", fontWeight: "bold", color: getColor(valueB, valueA) }}>
                    {valueB !== undefined && valueB !== null ? format(valueB) : "-"}
                </span>
            </div>
        </div>
    );
};

export default CompareMetricsCard;
