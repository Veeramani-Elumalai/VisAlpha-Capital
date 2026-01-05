import { useState } from "react";
import { getScreenerData } from "../services/screenerService";
import FinancialTable from "../components/screener/FinancialTable";
import ScreenerFilters from "../components/screener/ScreenerFilters";

export default function Screener() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  //  Filters state
  const [filters, setFilters] = useState({
    roe: "",
    pe: "",
    debt: ""
  });

  //  Financial tables state
  const [quarterly, setQuarterly] = useState([]);
  const [annual, setAnnual] = useState([]);

  //  Search stock
  const search = async () => {
    try {
      setError("");
      const res = await getScreenerData(symbol);

      setData(res);
      setQuarterly(res.quarterly || []);
      setAnnual(res.annual || []);
    } catch (err) {
      setError("Invalid stock symbol");
      setData(null);
      setQuarterly([]);
      setAnnual([]);
    }
  };

  //  Filter logic (future-ready)
  const passesFilters = (stock) => {
    if (filters.roe && stock.roe < filters.roe) return false;
    if (filters.pe && stock.pe > filters.pe) return false;
    if (filters.debt && stock.debtToEquity > filters.debt) return false;
    return true;
  };

  return (
    <div className="dashboard">
      <h2 style={{ color: "white" }}>📊 Stock Screener</h2>

      {/*  Search Bar */}
      <div className="add-box">
        <input
          placeholder="Search symbol (AAPL, MSFT)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />
        <button onClick={search}>Search</button>
      </div>

      {/*  Filters */}
      <ScreenerFilters filters={filters} setFilters={setFilters} />

      {/*  Error */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/*  Stock Summary */}
      {data && (
        <>
          <div className="summary">
            <div>
              <h4>Sector</h4>
              <p>{data.sector || "-"}</p>
            </div>

            <div>
              <h4>P/E</h4>
              <p>{data.pe || "-"}</p>
            </div>

            <div>
              <h4>ROE</h4>
              <p>{data.roe ? (data.roe * 100).toFixed(2) + "%" : "-"}</p>
            </div>

            <div>
              <h4>Debt / Equity</h4>
              <p>{data.debtToEquity || "-"}</p>
            </div>
          </div>

          {/* 📅 Quarterly Table */}
          <FinancialTable
            title="📅 Quarterly Results"
            data={quarterly}
          />

          {/* 📆 Annual Table */}
          <FinancialTable
            title="📆 Annual Results"
            data={annual}
          />
        </>
      )}
    </div>
  );
}
