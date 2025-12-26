import express from "express";
import Portfolio from "../models/Portfolio.js";
import auth from "../middleware/auth.js";
import { getLivePrice } from "../utils/marketService.js";


const router = express.Router();

/*
 Add Stock to Portfolio
*/
router.post("/add", auth, async (req, res) => {
  try {
    const { symbol, quantity, buyPrice } = req.body;

    let portfolio = await Portfolio.findOne({ userId: req.user });

    if (!portfolio) {
      portfolio = new Portfolio({
        userId: req.user,
        stocks: []
      });
    }

    portfolio.stocks.push({ symbol, quantity, buyPrice });
    await portfolio.save();

    res.json({ msg: "Stock added", portfolio });
  } catch (err) {
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
        profitLossPercent
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

export default router;
