console.log("✅ MARKET_SERVICE_URL =", process.env.MARKET_SERVICE_URL);

import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Stock Route Working");
});

router.get("/cagr/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.trim().toUpperCase();

    console.log("➡️ CAGR request for:", symbol);
    console.log("➡️ MARKET_SERVICE_URL:", process.env.MARKET_SERVICE_URL);

    const url = `${process.env.MARKET_SERVICE_URL}/cagr/${symbol}`;
    console.log("➡️ Calling Python URL:", url);

    const response = await axios.get(url);
    const { data } = response;

    // Detect empty or missing growth data
    const hasGrowthData = (data.revenueSeries && data.revenueSeries.length > 0) ||
      (data.profitSeries && data.profitSeries.length > 0);

    // Detect nested errors from FastAPI/yfinance
    if (data.error || (data.quoteSummary && data.quoteSummary.error) || !hasGrowthData) {
      return res.status(400).json({
        error: "Invalid symbol",
        reason: data.quoteSummary?.error?.description || "Growth data not found",
      });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ CAGR ROUTE FAILED");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("Response:", err.response?.data);

    res.status(500).json({
      error: "CAGR fetch failed",
      reason: err.message,
    });
  }
});

router.get("/advisor/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.trim().toUpperCase();
    console.log("➡️ Advisor request for:", symbol);

    const url = `${process.env.MARKET_SERVICE_URL}/advisor/${symbol}`;
    const response = await axios.get(url);
    
    if (response.data.error) {
      return res.status(400).json(response.data);
    }

    res.json(response.data);
  } catch (err) {
    console.error("❌ ADVISOR ROUTE FAILED", err.message);
    res.status(500).json({
      error: "Advisor analysis failed",
      reason: err.message,
    });
  }
});

export default router;
