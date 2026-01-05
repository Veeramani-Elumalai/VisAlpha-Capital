export default function ValuationScore({ stock }) {
  let score = 0;

  if (stock.pe < 20) score += 25;
  if (stock.roe > 15) score += 25;
  if (stock.debtEquity < 0.5) score += 25;
  if (stock.revenueGrowth > 10) score += 25;

  let label =
    score >= 75 ? "Excellent" :
    score >= 50 ? "Good" :
    score >= 25 ? "Average" : "Risky";

  return (
    <div className="valuation">
      <h4>Valuation Score</h4>
      <p style={{ color: score >= 50 ? "limegreen" : "orange" }}>
        {score}/100 – {label}
      </p>
    </div>
  );
}
