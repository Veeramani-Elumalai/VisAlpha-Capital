import express from "express";
import Portfolio from "../models/Portfolio.js";
import auth from "../middleware/auth.js";

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
    res.json(portfolio || { stocks: [] });
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
