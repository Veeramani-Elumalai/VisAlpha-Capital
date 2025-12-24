import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  stocks: [
    {
      symbol: { type: String, required: true },
      quantity: { type: Number, required: true },
      buyPrice: { type: Number, required: true }
    }
  ]
}, { timestamps: true });

export default mongoose.model("Portfolio", portfolioSchema);
