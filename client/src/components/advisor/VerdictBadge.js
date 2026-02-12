import React from "react";

const VerdictBadge = ({ verdict }) => {
    const styles = {
        BUY: { backgroundColor: "#10b981", color: "white" }, // Green
        HOLD: { backgroundColor: "#f59e0b", color: "white" }, // Yellow
        AVOID: { backgroundColor: "#ef4444", color: "white" }, // Red
    };

    const currentStyle = styles[verdict] || { backgroundColor: "#6b7280", color: "white" };

    return (
        <span
            style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                fontWeight: "bold",
                fontSize: "1.2rem",
                display: "inline-block",
                ...currentStyle,
            }}
        >
            {verdict}
        </span>
    );
};

export default VerdictBadge;
