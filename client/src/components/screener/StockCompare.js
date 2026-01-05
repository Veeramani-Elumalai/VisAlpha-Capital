export default function StockCompare({ stocks }) {
  if (stocks.length < 2) return null;

  return (
    <div className="compare-grid">
      {stocks.map((s) => (
        <div key={s.symbol} className="compare-card">
          <h4>{s.symbol}</h4>
          <p>PE: {s.pe}</p>
          <p>ROE: {s.roe}%</p>
          <p>Debt/Equity: {s.debtEquity}</p>
          <p>Market Cap: ${s.marketCap}</p>
        </div>
      ))}
    </div>
  );
}
