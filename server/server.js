import dotenv from "dotenv";
dotenv.config(); // ✅ MUST be first

import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

// Database connect
connectDB();

// Routes (import AFTER dotenv)
import authRoutes from "./src/routes/auth.routes.js";
import portfolioRoutes from "./src/routes/portfolio.routes.js";
import stockRoutes from "./src/routes/stock.routes.js";
import screenerRoutes from "./src/routes/screener.routes.js";

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/screener", screenerRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("VisAlpha Capital Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
