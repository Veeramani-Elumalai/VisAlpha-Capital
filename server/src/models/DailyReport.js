import mongoose from "mongoose";

const signalSchema = new mongoose.Schema(
    {
        stock: { type: String, required: true },
        headline: { type: String, required: true },
        url: { type: String },
        reason: { type: String, required: true },
        suggestedAction: { type: String, required: true },
    },
    { _id: false }
);

const dailyReportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        date: {
            type: String, // "YYYY-MM-DD"
            required: true,
            index: true,
        },
        positiveSignals: [signalSchema],
        negativeSignals: [signalSchema],
        generatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound unique index: one report per user per day
dailyReportSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyReport", dailyReportSchema);
