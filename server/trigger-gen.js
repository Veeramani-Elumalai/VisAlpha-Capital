import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { generateDailyReport } from "./src/services/dailyReport.service.js";
import Portfolio from "./src/models/Portfolio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function manualTrigger() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const samplePortfolio = await Portfolio.findOne();
        if (!samplePortfolio) {
            console.error("❌ No portfolio found in DB to test");
            return;
        }
        const userId = samplePortfolio.userId;
        console.log(`📡 Triggering fresh Groq generation for user ${userId}...`);

        // Force true to ignore any existing report
        const result = await generateDailyReport(userId, true);
        const report = result.report;

        console.log("\n✅ Generation Complete!");
        console.log("Date:", report.date);
        console.log("Positive Signals:", report.positiveSignals.length);
        console.log("Negative Signals:", report.negativeSignals.length);

        console.log("\nSample Signal (Groq output):");
        if (report.positiveSignals.length > 0) {
            console.log(`- ${report.positiveSignals[0].stock}: ${report.positiveSignals[0].headline}`);
        }
    } catch (err) {
        console.error("❌ Generation failed:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

manualTrigger();
