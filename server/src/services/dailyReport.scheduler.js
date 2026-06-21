/**
 * dailyReport.scheduler.js
 * ─────────────────────────────────────────────────────────────────
 * Since reports are now per-user, scheduled bulk pre-generation would
 * require iterating all users — instead we rely on on-demand generation
 * (each user's first GET request of the day triggers their report).
 *
 * This scheduler is kept as a lightweight heartbeat logger only.
 * If you want to pre-warm reports for all users in the future,
 * uncomment the bulk generation block below.
 * ─────────────────────────────────────────────────────────────────
 */

import cron from "node-cron";
// import User from "../models/User.js";
// import Portfolio from "../models/Portfolio.js";
// import { generateDailyReport } from "./dailyReport.service.js";

/**
 * Starts the daily report scheduler.
 * Call this once from server.js after DB connection is established.
 */
export function startDailyReportScheduler() {
    // Heartbeat log at 07:00 every day (NYSE timezone)
    cron.schedule(
        "0 7 * * *",
        () => {
            console.log("[Scheduler] ⏰ Market open — daily reports will be generated on first user request.");

            // ── Optional: Bulk pre-generation for all users with portfolios ──
            // Uncomment the block below if you want reports pre-warmed at 7 AM:
            //
            // (async () => {
            //   try {
            //     const portfolios = await Portfolio.find({}).distinct("userId");
            //     console.log(`[Scheduler] Pre-generating reports for ${portfolios.length} users …`);
            //     for (const userId of portfolios) {
            //       try {
            //         await generateDailyReport(userId);
            //       } catch (e) {
            //         console.error(`[Scheduler] Failed for user ${userId}:`, e.message);
            //       }
            //     }
            //     console.log("[Scheduler] ✅ Bulk pre-generation complete");
            //   } catch (err) {
            //     console.error("[Scheduler] ❌ Bulk pre-generation failed:", err.message);
            //   }
            // })();
        },
        {
            timezone: "America/New_York",
        }
    );

    console.log("[Scheduler] 📅 Daily market report scheduler started (heartbeat at 07:00 ET, on-demand generation per user)");
}
