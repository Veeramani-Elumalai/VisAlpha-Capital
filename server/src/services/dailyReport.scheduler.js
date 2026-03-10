/**
 * dailyReport.scheduler.js
 * ─────────────────────────────────────────────────────────────────
 * Runs once per day at 07:00 AM server local time.
 * Uses node-cron for scheduling.
 * Idempotency is enforced inside generateDailyReport() itself,
 * so even if the scheduler fires multiple times nothing duplicates.
 * ─────────────────────────────────────────────────────────────────
 */

import cron from "node-cron";
import { generateDailyReport } from "./dailyReport.service.js";

/**
 * Starts the daily report scheduler.
 * Call this once from server.js after DB connection is established.
 */
export function startDailyReportScheduler() {
    // ── Scheduled job: 07:00 every day ──────────────────────────
    cron.schedule(
        "0 7 * * *",
        async () => {
            console.log("[Scheduler] ⏰ Triggering daily market report generation …");
            try {
                await generateDailyReport();
                console.log("[Scheduler] ✅ Daily market report generation complete");
            } catch (err) {
                console.error("[Scheduler] ❌ Daily report generation failed:", err.message);
            }
        },
        {
            timezone: "America/New_York", // NYSE timezone — adjust as needed
        }
    );

    console.log("[Scheduler] 📅 Daily market report scheduler started (runs at 07:00 ET)");
}
