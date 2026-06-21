/**
 * dailyReport.routes.js
 * ─────────────────────────────────────────────────────────────────
 * GET  /api/daily-report          — returns today's stored report for the logged-in user
 * POST /api/daily-report/generate — manually trigger regeneration (auth guarded)
 * ─────────────────────────────────────────────────────────────────
 */

import express from "express";
import auth from "../middleware/auth.js";
import { getTodayReport, generateDailyReport } from "../services/dailyReport.service.js";

const router = express.Router();

/**
 * GET /api/daily-report
 * Returns today's report for the authenticated user.
 * If no report exists yet, triggers on-demand generation for this user only.
 * If the user has no portfolio, returns a { hasPortfolio: false } response.
 */
router.get("/", auth, async (req, res) => {
    try {
        const userId = req.user; // set by auth middleware

        // Check for an existing report first (fast path)
        let report = await getTodayReport(userId);

        if (!report) {
            // First request of the day for this user — generate on demand
            console.log(`[DailyReport] No report for user ${userId} today — generating on demand …`);
            const result = await generateDailyReport(userId);

            if (!result.hasPortfolio) {
                // User has no stocks — return graceful empty response
                return res.json({
                    hasPortfolio: false,
                    positiveSignals: [],
                    negativeSignals: [],
                    date: new Date().toISOString().split("T")[0],
                    generatedAt: new Date().toISOString(),
                });
            }

            report = result.report;
        }

        res.json({ ...report, hasPortfolio: true });
    } catch (err) {
        console.error("[DailyReport] GET /api/daily-report error:", err.message);
        res.status(500).json({ error: "Failed to retrieve daily report", detail: err.message });
    }
});

/**
 * POST /api/daily-report/generate
 * Manually forces regeneration of today's report for the logged-in user.
 */
router.post("/generate", auth, async (req, res) => {
    try {
        const userId = req.user;
        const result = await generateDailyReport(userId, true /* force */);

        if (!result.hasPortfolio) {
            return res.json({
                message: "No portfolio found. Add stocks to your portfolio to get personalized signals.",
                hasPortfolio: false,
                report: {
                    positiveSignals: [],
                    negativeSignals: [],
                    date: new Date().toISOString().split("T")[0],
                    generatedAt: new Date().toISOString(),
                }
            });
        }

        res.json({ message: "Report generated successfully", report: result.report, hasPortfolio: true });
    } catch (err) {
        console.error("[DailyReport] POST /api/daily-report/generate error:", err.message);
        res.status(500).json({ error: "Report generation failed", detail: err.message });
    }
});

export default router;
