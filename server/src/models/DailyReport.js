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
        date: {
            type: String, // "YYYY-MM-DD"
            required: true,
            unique: true,
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

export default mongoose.model("DailyReport", dailyReportSchema);
