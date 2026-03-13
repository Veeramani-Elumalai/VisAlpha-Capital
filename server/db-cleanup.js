import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import DailyReport from "./src/models/DailyReport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function cleanupAndSync() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    const today = new Date().toISOString().split("T")[0];
    console.log(`Checking for reports on ${today}...`);

    // Find all reports for today
    const reports = await DailyReport.find({ date: today }).sort({ generatedAt: -1 });

    if (reports.length > 1) {
      console.log(`Found ${reports.length} reports for today. Keeping the newest one (Generated: ${reports[0].generatedAt})`);
      
      const idsToDelete = reports.slice(1).map(r => r._id);
      const deleteRes = await DailyReport.deleteMany({ _id: { $in: idsToDelete } });
      
      console.log(`✅ Deleted ${deleteRes.deletedCount} duplicate reports.`);
    } else if (reports.length === 1) {
      console.log(`✅ Single report found for today. No duplicates.`);
    } else {
      console.log(`ℹ️ No report found for today.`);
    }

    // Force sync indexes to ensure 'unique: true' is Enforced
    console.log("Syncing indexes...");
    await DailyReport.syncIndexes();
    console.log("✅ Indexes synced.");

  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("Connection closed.");
  }
}

cleanupAndSync();
