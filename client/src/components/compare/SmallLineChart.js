import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const SmallLineChart = ({ data, color = "#3b82f6", label }) => {
    if (!data || data.length === 0) return <div style={{ color: "#64748b", fontSize: "12px" }}>No Data</div>;

    // Format labels to just show Year
    const labels = data.map((d) => d.period.substring(0, 4));

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: label,
                data: data.map((d) => d.value),
                borderColor: color,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, "rgba(0,0,0,0)");
                    return gradient;
                },
                tension: 0.4,
                fill: true,
                pointRadius: 4, // Show points
                pointHoverRadius: 6,
                pointBackgroundColor: color,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            // Format as Billions if > 1B, else Millions
                            const val = context.parsed.y;
                            if (val >= 1e9) {
                                label += (val / 1e9).toFixed(2) + 'B';
                            } else if (val >= 1e6) {
                                label += (val / 1e6).toFixed(2) + 'M';
                            } else {
                                label += val.toLocaleString();
                            }
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            x: {
                display: true, // Show years on X axis
                grid: { display: false },
                ticks: { color: "#94a3b8", fontSize: 10 }
            },
            y: {
                display: false, // Keep Y axis hidden to stay "small" but data is there
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    return (
        <div style={{ height: "150px", width: "100%" }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default SmallLineChart;
