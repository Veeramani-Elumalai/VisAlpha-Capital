import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import DailyReport from "./src/models/DailyReport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function clearToday() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today = new Date().toISOString().split("T")[0];
        const result = await DailyReport.deleteOne({ date: today });
        if (result.deletedCount > 0) {
            console.log(`✅ Successfully deleted existing report for ${today}. The next page load will trigger a fresh Groq generation.`);
        } else {
            console.log(`ℹ️ No report found for ${today} to delete.`);
        }
    } catch (err) {
        console.error("❌ Failed to clear report:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

clearToday();
