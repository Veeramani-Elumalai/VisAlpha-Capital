import express from "express";
import axios from "axios";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;

    const { data } = await axios.get(
      `http://127.0.0.1:8000/screener/${symbol}`
    );

    const hasData = data.sector || (data.quarterly && data.quarterly.length > 0) || (data.annual && data.annual.length > 0);

    if (data.error || (data.quoteSummary && data.quoteSummary.error) || !hasData) {
      return res.status(400).json({ msg: "Invalid symbol" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: "Screener fetch failed" });
  }
});

router.get("/screener/:symbol", async (req, res) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/screener/${req.params.symbol}`
    );
    const { data } = response;
    const hasData = data.sector || (data.quarterly && data.quarterly.length > 0) || (data.annual && data.annual.length > 0);

    if (data.error || (data.quoteSummary && data.quoteSummary.error) || !hasData) {
      return res.status(400).json({ msg: "Invalid symbol" });
    }
    res.json(data);
  } catch (err) {
    res.status(400).json({ msg: "Invalid symbol" });
  }
});


export default router;
