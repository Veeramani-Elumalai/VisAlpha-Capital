import { useEffect, useState } from "react";
import { fetchCagr } from "../../services/screenerService";
import SmallLineChart from "../charts/SmallLineChart";

export default function CagrSection({ symbol }) {
  const [frequency] = useState("annual");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    setData(null); // Clear previous growth data while loading new
    fetchCagr(symbol, frequency)
      .then(setData)
      .catch((err) => {
        console.error("CAGR fetch failed:", err);
        setData(null);
      });
  }, [symbol, frequency]);

  if (!data) return null;

  return (
    <div>
      <h3>Growth (5Y)</h3>
      <p>
        📈 Revenue CAGR:{" "}
        <b style={{ color: data.revenueCagr < 0 ? "red" : "green" }}>
          {data.revenueCagr ?? "N/A"}%
        </b>
      </p>

      <p>
        💰 Profit CAGR:{" "}
        <b style={{ color: "green" }}>
          {data.profitCagr ?? "N/A"}%
        </b>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <SmallLineChart
          key={`rev-${symbol}-${frequency}`}
          title="Revenue Growth"
          series={data.revenueSeries}
          frequency={frequency}
        />
        <SmallLineChart
          key={`prof-${symbol}-${frequency}`}
          title="Profit Growth"
          series={data.profitSeries}
          frequency={frequency}
        />
      </div>
    </div>
  );
}
