import axios from "axios";

const PYTHON_SERVICE_URL = process.env.MARKET_SERVICE_URL || "http://127.0.0.1:8000";

// Render free-tier cold starts can take up to 50s — retry once with a longer timeout
const axiosMarket = axios.create({
  baseURL: PYTHON_SERVICE_URL,
  timeout: 60000, // 60 seconds to allow for cold start wake-up
});

/**
 * Fetch live price data for a symbol from the Python market service.
 * Retries once if the first attempt fails (handles Render cold-start delays).
 */
export const getLivePrice = async (symbol, retries = 1) => {
  try {
    const res = await axiosMarket.get(`/price/${symbol}`);
    return res.data;
  } catch (err) {
    if (retries > 0) {
      console.warn(`[MarketService] Retrying price fetch for ${symbol}…`);
      await new Promise((r) => setTimeout(r, 3000)); // wait 3s before retry
      return getLivePrice(symbol, retries - 1);
    }
    console.error("[MarketService] getLivePrice failed:", err.message);
    return null;
  }
};

/**
 * Ping the market service to wake it up (call on server startup).
 */
export const wakeMarketService = async () => {
  try {
    await axiosMarket.get("/");
    console.log("[MarketService] ✅ Market service is awake.");
  } catch {
    console.warn("[MarketService] ⚠️ Market service did not respond on startup — it may be cold-starting.");
  }
};
