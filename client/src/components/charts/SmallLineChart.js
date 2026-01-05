import { Line } from "react-chartjs-2";

export default function SmallLineChart({ title, series, frequency }) {
  const labels = series.map((d) => {
    if (frequency === "quarterly") {
      const date = new Date(d.period);
      const q = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()} Q${q}`;
    }
    return d.period.slice(0, 4);
  });

  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: series.map((d) => d.value / 1e9),
        tension: 0.3,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        ticks: { callback: (v) => `${v}B` },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: 180 }}>
      <Line data={data} options={options} />
    </div>
  );
}
