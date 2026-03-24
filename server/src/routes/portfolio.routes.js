import express from "express";
import Portfolio from "../models/Portfolio.js";
import auth from "../middleware/auth.js";
import { getLivePrice } from "../utils/marketService.js";
import axios from "axios";

const router = express.Router();

/*
 Add Stock to Portfolio (with validation)
*/
router.post("/add", auth, async (req, res) => {
  try {
    let { symbol, quantity, buyPrice } = req.body;

    if (!symbol || !quantity || !buyPrice)
      return res.status(400).json({ msg: "All fields are required" });

    symbol = symbol.trim().toUpperCase();

    if (!/^[A-Z]{1,6}$/.test(symbol))
      return res.status(400).json({ msg: "Invalid stock symbol" });

    // Validate via Python service
    let liveData;
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/price/${symbol}`
      );
      liveData = response.data;
    } catch {
      return res.status(400).json({ msg: "Invalid Stock Symbol" });
    }

    if (!liveData?.price || liveData.price <= 0)
      return res.status(400).json({ msg: "Invalid Stock Symbol" });

    let portfolio = await Portfolio.findOne({ userId: req.user });

    if (!portfolio) {
      portfolio = new Portfolio({
        userId: req.user,
        stocks: []
      });
    }

    // 👉 CHECK IF STOCK ALREADY EXISTS
    const existing = portfolio.stocks.find(s => s.symbol === symbol);

    if (existing) {
      const oldQty = existing.quantity;
      const oldBuy = existing.buyPrice;

      const newQty = Number(quantity);
      const newBuy = Number(buyPrice);

      // Weighted Average Cost Formula
      const totalInvestment = oldQty * oldBuy + newQty * newBuy;
      const totalShares = oldQty + newQty;
      const avgPrice = totalInvestment / totalShares;

      existing.quantity = totalShares;
      existing.buyPrice = avgPrice;
    } else {
      portfolio.stocks.push({ symbol, quantity, buyPrice });
    }

    await portfolio.save();

    res.json({ msg: "Stock updated successfully", portfolio });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/*
 Get User Portfolio
*/
router.get("/", auth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user });

    if (!portfolio) return res.json({ stocks: [] });

    const enrichedStocks = [];

    for (const stock of portfolio.stocks) {
      const live = await getLivePrice(stock.symbol);
      if (!live?.price) continue;

      const currentPrice = live.price;

      const investedValue = stock.buyPrice * stock.quantity;
      const currentValue = currentPrice * stock.quantity;
      const profitLoss = currentValue - investedValue;
      const profitLossPercent = ((profitLoss / investedValue) * 100).toFixed(2);

      enrichedStocks.push({
        symbol: stock.symbol,
        quantity: stock.quantity,
        buyPrice: stock.buyPrice,
        currentPrice,
        investedValue,
        currentValue,
        profitLoss,
        profitLossPercent,
        previousClose: live.previousClose,
        dayChange: live.dayChange,
        dayChangePercent: live.dayChangePercent,
        sector: live.sector || "Unknown"
      });

    }

    res.json({
      userId: portfolio.userId,
      stocks: enrichedStocks
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
 Remove Stock
*/
router.delete("/remove/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;

    const portfolio = await Portfolio.findOne({ userId: req.user });
    if (!portfolio) return res.status(404).json({ msg: "Portfolio not found" });

    portfolio.stocks = portfolio.stocks.filter(
      (stock) => stock.symbol !== symbol
    );

    await portfolio.save();
    res.json({ msg: "Stock removed", portfolio });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
 Chart graph
*/

router.get("/performance", auth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user });
    if (!portfolio || portfolio.stocks.length === 0)
      return res.json({ history: [], benchmark: [] });

    const days = Number(req.query.days) || 30;
    const index = req.query.benchmark || "^GSPC";

    // 1. Fetch all stock data and the benchmark data in parallel
    const stockPromises = portfolio.stocks.map((stock) =>
      axios
        .get(`http://127.0.0.1:8000/history/${stock.symbol}?days=${days + 5}`) // Fetch slightly extra to ensure overlap
        .then((res) => ({ symbol: stock.symbol, quantity: stock.quantity, history: res.data.history }))
        .catch(() => ({ symbol: stock.symbol, quantity: stock.quantity, history: [] }))
    );

    const [stockResults, benchRes] = await Promise.all([
      Promise.all(stockPromises),
      axios.get(`http://127.0.0.1:8000/history/${index}?days=${days}`).catch(() => ({ data: { history: [] } })),
    ]);

    const benchHistory = benchRes.data.history;
    if (benchHistory.length === 0) return res.json({ portfolio: [], benchmark: [] });

    // 2. Identify master timeline from Benchmark (it sets the dates we care about)
    const masterTimeline = benchHistory.map((h) => h.date);

    // 3. For each stock, create a Map for quick lookup and store the last known price for forward-filling
    const stockDataMaps = stockResults.map((s) => {
      const map = new Map();
      s.history.forEach((h) => map.set(h.date, h.price));
      return { symbol: s.symbol, quantity: s.quantity, priceMap: map, lastPrice: 0 };
    });

    // 4. Compute Portfolio Value for every date in the timeline using forward-filling
    const portfolioRaw = [];
    masterTimeline.forEach((date) => {
      let dailyTotal = 0;
      stockDataMaps.forEach((stock) => {
        const price = stock.priceMap.get(date);
        if (price !== undefined && price !== null) {
          stock.lastPrice = price; // Update last known price
        }
        dailyTotal += stock.lastPrice * stock.quantity;
      });
      portfolioRaw.push({ date, value: dailyTotal });
    });

    // 5. Normalize both series to 100
    const portBase = portfolioRaw.find((p) => p.value > 0)?.value || 1;
    const benchBase = benchHistory[0]?.price || 1;

    const portfolioHistory = portfolioRaw.map((p) => ({
      date: p.date,
      value: Number(((p.value / portBase) * 100).toFixed(2)),
    }));

    const benchmark = benchHistory.map((h) => ({
      date: h.date,
      value: Number(((h.price / benchBase) * 100).toFixed(2)),
    }));

    res.json({ portfolio: portfolioHistory, benchmark });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

