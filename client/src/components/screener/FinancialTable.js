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
                    {row[col] !== null && row[col] !== undefined
                      ? row[col]
                      : "-"}
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
