const formatValue = (val) => {
  if (val === null || val === undefined) return "-";
  if (typeof val === "number" || (!isNaN(parseFloat(val)) && isFinite(val))) {
    const num = Number(val);
    if (Math.abs(num) >= 1.0e12) return (num / 1.0e12).toFixed(2) + "T";
    if (Math.abs(num) >= 1.0e9) return (num / 1.0e9).toFixed(2) + "B";
    if (Math.abs(num) >= 1.0e6) return (num / 1.0e6).toFixed(2) + "M";
    // Avoid formatting small numbers (like 2023 for year) if they are close to integers or dates
    // But here we likely get raw financial numbers. 
    // A safety check: if it looks like a year (e.g. 2020-2030), maybe don't format?
    // Actually "Period" column is usually first and is handled separately or is a string "2023"
    // If the API sends strings for Period, this check handles it.
    return num.toLocaleString();
  }
  return val;
};

export default function FinancialTable({ title, data }) {
  //  Guard: no data or empty array
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="card">
        <h3>{title}</h3>
        <p style={{ color: "#9ca3af" }}>No data available</p>
      </div>
    );
  }

  //  Get table columns safely
  const columns = Object.keys(data[0]);

  return (
    <div className="card">
      <h3>{title}</h3>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col}>
                    {col === "Period" ? row[col] : formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
