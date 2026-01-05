import api from "./api";

export const getScreenerData = async (symbol) => {
  if (!symbol) return null;

  const cleanSymbol = symbol.trim().toUpperCase();

  const res = await api.get(`/api/screener/${cleanSymbol}`);
  return res.data;
};

export const fetchCagr = async (symbol, frequency = "annual") => {
  if (!symbol) return null;

  const cleanSymbol = symbol.trim().toUpperCase();

  const res = await api.get(
    `/api/stocks/cagr/${cleanSymbol}?frequency=${frequency}`
  );

  return res.data;
};