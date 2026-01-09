import { useState, useEffect } from "react";
import { getScreenerData } from "../services/screenerService";
import FinancialTable from "../components/screener/FinancialTable";
import CagrSection from "../components/screener/CagrSection";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Screener() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  //  Financial tables state
  const [quarterly, setQuarterly] = useState([]);
  const [annual, setAnnual] = useState([]);

  // Auto-search if query param exists
  useEffect(() => {
    const query = searchParams.get("query");
    if (query) {
      setSymbol(query);
      handleSearch(query);
    }
  }, [searchParams]);

  //  Search stock
  const handleSearch = async (stockSymbol) => {
    if (!stockSymbol) return;
    try {
      setError("");
      const res = await getScreenerData(stockSymbol);

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

  const search = () => handleSearch(symbol);

  return (
    <div className="dashboard">
      <header className="top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "white", margin: 0 }}>📊 Stock Screener</h2>
        <a href="/dashboard" className="logout" style={{ textDecoration: "none", background: "#3b82f6" }}>
          Back to Dashboard
        </a>
      </header>

      {/*  Search Bar */}
      <div className="add-box">
        <input
          placeholder="Search symbol (AAPL, MSFT)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />
        <button onClick={search}>Search</button>
      </div>

      {/*  Error */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/*  Stock Summary */}
      {data && (
        <>
          <div className="summary">
            <div>
              <h4>Sector</h4>
              <p
                onClick={() => data.sector && navigate(`/sector-analysis?sector=${data.sector}`)}
                style={{
                  cursor: data.sector ? "pointer" : "default",
                  color: data.sector ? "#3b82f6" : "inherit",
                  textDecoration: data.sector ? "underline" : "none"
                }}
              >
                {data.sector || "-"}
              </p>
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
          {/* 📆 Annual Table */}
          <CagrSection symbol={symbol} />
        </>
      )}
    </div>
  );
}
