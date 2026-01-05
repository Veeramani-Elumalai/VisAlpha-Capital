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

    res.json(response.data);
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

export default router;
