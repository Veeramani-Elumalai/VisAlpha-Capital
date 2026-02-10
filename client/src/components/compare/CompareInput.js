import React from "react";

const CompareInput = ({ symbol, setSymbol, onSearch, loading, label }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      <label style={{ color: "#94a3b8", fontSize: "14px" }}>{label}</label>
      <div className="add-box" style={{ width: "100%", margin: 0 }}>
        <input
          placeholder="Enter Symbol (e.g., AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          disabled={loading}
          onKeyPress={(e) => e.key === "Enter" && onSearch && onSearch()}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default CompareInput;
