/**
 * dailyReport.routes.js
 * ─────────────────────────────────────────────────────────────────
 * GET  /api/daily-report          — returns today's stored report
 * POST /api/daily-report/generate — manually trigger generation (auth guarded)
 * ─────────────────────────────────────────────────────────────────
 */

import express from "express";
import auth from "../middleware/auth.js";
import { getTodayReport, generateDailyReport } from "../services/dailyReport.service.js";

const router = express.Router();

/**
 * GET /api/daily-report
 * Returns today's report. If it doesn't exist yet, triggers
 * a one-time on-demand generation (first request of the day).
 * No auth required — read-only public endpoint within the app.
 */
router.get("/", auth, async (req, res) => {
    try {
        let report = await getTodayReport();

        if (!report) {
            // First request of the day — generate on demand
            console.log("[DailyReport] No report for today — generating on demand …");
            report = await generateDailyReport();
        }

        res.json(report);
    } catch (err) {
        console.error("[DailyReport] GET /api/daily-report error:", err.message);
        res.status(500).json({ error: "Failed to retrieve daily report", detail: err.message });
    }
});

/**
 * POST /api/daily-report/generate
 * Manually forces regeneration of today's report.
 * Useful for development / admin use.
 */
router.post("/generate", auth, async (req, res) => {
    try {
        const report = await generateDailyReport(true /* force */);
        res.json({ message: "Report generated successfully", report });
    } catch (err) {
        console.error("[DailyReport] POST /api/daily-report/generate error:", err.message);
        res.status(500).json({ error: "Report generation failed", detail: err.message });
    }
});

export default router;
