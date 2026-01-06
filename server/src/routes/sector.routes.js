import express from "express";
import axios from "axios";

const router = express.Router();

// GET /api/sector/:sectorName
router.get("/:sectorName", async (req, res) => {
  try {
    const { sectorName } = req.params;
    const marketServiceUrl = process.env.MARKET_SERVICE_URL || "http://127.0.0.1:8000";
    
    console.log(`➡️ Fetching sector data for: ${sectorName}`);

    const response = await axios.get(`${marketServiceUrl}/sector/${sectorName}`);

    if (response.data.error) {
         return res.status(404).json(response.data);
    }

    res.json(response.data);
  } catch (err) {
    console.error("❌ Sector Fetch Failed:", err.message);
    res.status(500).json({ msg: "Failed to fetch sector data", error: err.message });
  }
});

export default router;
