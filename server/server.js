import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Database connect
connectDB();

// Default route
app.get("/", (req, res) => {
  res.send("VisAlpha Capital Backend Running 🚀");
});

// Import Routes
import authRoutes from "./src/routes/auth.routes.js";
import portfolioRoutes from "./src/routes/portfolio.routes.js";
import stockRoutes from "./src/routes/stock.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/stock", stockRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
