export default function ScreenerFilters({ filters, setFilters }) {
  return (
    <div className="filters">
      <input
        placeholder="Min ROE %"
        type="number"
        onChange={(e) => setFilters({ ...filters, roe: e.target.value })}
      />

      <input
        placeholder="Max P/E"
        type="number"
        onChange={(e) => setFilters({ ...filters, pe: e.target.value })}
      />

      <input
        placeholder="Max Debt/Equity"
        type="number"
        onChange={(e) => setFilters({ ...filters, debt: e.target.value })}
      />
    </div>
  );
}
