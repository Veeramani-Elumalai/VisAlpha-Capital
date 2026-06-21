/**
 * migrate-daily-reports.js
 * ─────────────────────────────────────────────────────────────────
 * One-time migration script.
 *
 * What it does:
 *   1. Drops the old `DailyReport` collection entirely (old reports
 *      had no userId and a global unique index on `date` — they are
 *      not reusable after the schema change).
 *   2. Mongoose will recreate the collection with the new compound
 *      index { userId, date } on next server start.
 *
 * Daily reports are regenerated automatically on each user's first
 * request of the day, so dropping old data is safe.
 *
 * Usage:
 *   node migrate-daily-reports.js
 * ─────────────────────────────────────────────────────────────────
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌  MONGO_URI is not set in .env");
  process.exit(1);
}

async function migrate() {
  console.log("🔗 Connecting to MongoDB …");
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected");

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "dailyreports" }).toArray();

  if (collections.length === 0) {
    console.log("ℹ️  No existing 'dailyreports' collection found — nothing to migrate.");
  } else {
    await db.dropCollection("dailyreports");
    console.log("🗑️  Dropped old 'dailyreports' collection (global, non-user-specific reports).");
    console.log("✅  New per-user reports will be created automatically on next user request.");
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Migration complete.");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
