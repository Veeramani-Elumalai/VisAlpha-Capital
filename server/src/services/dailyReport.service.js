/**
 * dailyReport.service.js
 * ─────────────────────────────────────────────────────────────────
 * Orchestrates per-user daily reports:
 *   1. News fetching from NewsAPI (four categories, top-10 total)
 *   2. User's own portfolio holdings from MongoDB
 *   3. LLM structured analysis (Groq Llama 3) — personalised to user's stocks
 *   4. Persistence to DailyReport collection (one per user per day)
 * ─────────────────────────────────────────────────────────────────
 */

import axios from "axios";
import Groq from "groq-sdk";
import Portfolio from "../models/Portfolio.js";
import DailyReport from "../models/DailyReport.js";
import { getLivePrice } from "../utils/marketService.js";

// Lazy-initialize Groq client to ensure environment variables are loaded
let groqClient = null;
const getGroqClient = () => {
    if (!groqClient) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing in environment variables");
        }
        groqClient = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groqClient;
};

// ── helpers ─────────────────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD" (server local) */
function todayDateString() {
    const d = new Date();
    return d.toISOString().split("T")[0];
}

// ── 1. News Fetching ─────────────────────────────────────────────

/**
 * Fetches up to `limit` articles for a given NewsAPI query string.
 * Never throws — returns [] on error.
 */
async function fetchCategory(query, label, limit, apiKey) {
    try {
        const url =
            `https://newsapi.org/v2/everything` +
            `?q=${encodeURIComponent(query)}` +
            `&language=en&sortBy=publishedAt&pageSize=${limit}&apiKey=${apiKey}`;

        const res = await axios.get(url, { timeout: 8000 });
        return (res.data.articles || []).map((a) => ({
            title: a.title || "",
            description: a.description || "",
            source: a.source?.name || "Unknown",
            url: a.url || "",
            category: label,
        }));
    } catch {
        return [];
    }
}

/**
 * Returns exactly 10 normalised headlines spread across 4 categories.
 * Category budget: Economy 3, Earnings 3, Sector 2, Market 2
 */
async function fetchTopHeadlines() {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) throw new Error("NEWS_API_KEY is not set");

    const [economy, earnings, sector, market] = await Promise.all([
        fetchCategory("economy inflation GDP federal reserve", "Economy", 3, apiKey),
        fetchCategory("quarterly earnings revenue profit beat miss", "Earnings", 3, apiKey),
        fetchCategory("sector stocks technology healthcare energy finance", "Sector", 2, apiKey),
        fetchCategory("stock market index S&P NASDAQ Dow Jones", "Market", 2, apiKey),
    ]);

    const seen = new Set();
    const combined = [];

    for (const article of [...economy, ...earnings, ...sector, ...market]) {
        if (!article.title || seen.has(article.title)) continue;
        seen.add(article.title);
        combined.push(article);
        if (combined.length === 10) break;
    }

    return combined;
}

// ── 2. Portfolio Holdings (Per-User) ────────────────────────────

/**
 * Returns the specific user's holdings as { symbol, sector }[].
 * Returns empty array if the user has no portfolio.
 *
 * @param {string} userId — MongoDB ObjectId string of the requesting user
 */
async function fetchUserHoldings(userId) {
    try {
        const portfolio = await Portfolio.findOne({ userId });
        if (!portfolio || portfolio.stocks.length === 0) return [];

        const holdings = [];
        for (const stock of portfolio.stocks) {
            let sector = "Unknown";
            try {
                // Pass retries = 0 to prevent excessive retry delay during report generation
                const live = await getLivePrice(stock.symbol, 0);
                if (live?.sector) sector = live.sector;
            } catch {
                // ignore — sector is optional
            }
            holdings.push({ symbol: stock.symbol, sector });
        }

        return holdings;
    } catch {
        return [];
    }
}

// ── 3. LLM Processing ───────────────────────────────────────────

/**
 * Sends structured context to Groq and returns parsed JSON.
 * Tries models in candidate order to prevent 404 model_not_found failures.
 * Prompt enforces strict JSON output — no markdown, no prose.
 */
async function callLLM(headlines, holdings) {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");

    const holdingLines = holdings.length
        ? holdings.map((h) => `  - ${h.symbol} (${h.sector})`).join("\n")
        : "  (No holdings found — use general market analysis)";

    const headlineLines = headlines
        .map(
            (h, i) =>
                `  ${i + 1}. [${h.category}] ${h.title} — ${h.source} (URL: ${h.url})`
        )
        .join("\n");

    const systemPrompt = `You are a professional financial analyst AI. 
You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no prose. 
The JSON structure must be exactly:
{
  "positiveSignals": [
    { "stock": "TICKER", "headline": "...", "url": "...", "reason": "2-3 sentence detailed explanation", "suggestedAction": "Buy / Hold / Add" }
  ],
  "negativeSignals": [
    { "stock": "TICKER", "headline": "...", "url": "...", "reason": "2-3 sentence detailed explanation", "suggestedAction": "Sell / Reduce / Watch" }
  ]
}
Rules:
- Match headlines exclusively to portfolio stocks. If there are no relevant headlines for a stock, or if the headlines do not present a clear opportunity or risk for that stock, DO NOT include it in the report.
- Do NOT use sector ETF tickers or unrelated stocks as fallbacks.
- Keep the arrays empty if no genuine signals are detected.
- FOR EACH SIGNAL, YOU MUST INCLUDE THE EXACT URL FROM THE NEWS HEADLINE PROVIDED
- reason must be 2-3 sentences explaining the market impact
- suggestedAction must be one of: Buy, Hold, Sell, Add, Reduce, Watch
- Respond with ONLY the JSON — nothing else`;

    const userPrompt = `Today's Portfolio Holdings:\n${holdingLines}\n\nTop 10 Market Headlines:\n${headlineLines}\n\nGenerate the daily market signal report.`;

    let dynamicModels = [];
    try {
        const modelsList = await getGroqClient().models.list();
        if (modelsList?.data) {
            dynamicModels = modelsList.data
                .map(m => m.id)
                .filter(id => !id.includes("whisper") && !id.includes("guard") && !id.includes("orpheus"));
        }
    } catch (e) {
        // Ignore listing errors and rely on standard candidate list
    }

    const candidateModels = [
        process.env.GROQ_MODEL,
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.6-27b",
        "groq/compound",
        ...dynamicModels,
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ].filter(Boolean);

    const modelsToTry = [...new Set(candidateModels)];

    let response = null;
    let lastError = null;

    for (const model of modelsToTry) {
        try {
            response = await getGroqClient().chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                model,
                temperature: 0.2,
            });
            if (response?.choices?.[0]?.message?.content) {
                console.log(`[DailyReport] Successfully generated report using model '${model}'`);
                break;
            }
        } catch (err) {
            lastError = err;
            console.warn(`[DailyReport] Model '${model}' failed: ${err.message}. Trying next fallback model…`);
        }
    }

    if (!response) {
        throw new Error(`All Groq LLM models failed. Last error: ${lastError?.message || "Unknown error"}`);
    }

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("Groq returned empty response");

    // Strip markdown fences if model adds them despite instructions
    const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    let parsed;
    try {
        parsed = JSON.parse(clean);
    } catch {
        throw new Error(`LLM output is not valid JSON: ${clean.slice(0, 200)}`);
    }

    // Validate structure
    if (!Array.isArray(parsed.positiveSignals) || !Array.isArray(parsed.negativeSignals)) {
        throw new Error("LLM JSON missing positiveSignals or negativeSignals arrays");
    }

    return parsed;
}

// ── 4. Orchestrator ──────────────────────────────────────────────

/**
 * Generates (or retrieves) today's daily report for a specific user.
 *
 * @param {string}  userId  — MongoDB ObjectId of the requesting user
 * @param {boolean} force   — If true, regenerate even if today's report exists
 * @returns {Promise<{ report: DailyReport|null, hasPortfolio: boolean }>}
 */
export async function generateDailyReport(userId, force = false) {
    const today = todayDateString();

    // Idempotency guard — return existing report unless forced
    if (!force) {
        const existing = await DailyReport.findOne({ userId, date: today }).sort({ generatedAt: -1 });
        if (existing) {
            console.log(`[DailyReport] Report for user ${userId} on ${today} already exists — skipping`);
            return { report: existing, hasPortfolio: true };
        }
    }

    console.log(`[DailyReport] Generating report for user ${userId} on ${today} …`);

    // Fetch this user's holdings first
    const holdings = await fetchUserHoldings(userId);

    // If the user has no stocks, return early — no point calling LLM
    if (holdings.length === 0) {
        console.log(`[DailyReport] User ${userId} has no portfolio — skipping LLM call`);
        return { report: null, hasPortfolio: false };
    }

    const headlines = await fetchTopHeadlines();

    console.log(`[DailyReport] Fetched ${headlines.length} headlines, ${holdings.length} holdings for user ${userId}`);

    const llmResult = await callLLM(headlines, holdings);

    console.log(
        `[DailyReport] LLM returned ${llmResult.positiveSignals.length} positive, ${llmResult.negativeSignals.length} negative signals for user ${userId}`
    );

    // Upsert — replace if force, otherwise insert
    const report = await DailyReport.findOneAndUpdate(
        { userId, date: today },
        {
            userId,
            date: today,
            positiveSignals: llmResult.positiveSignals,
            negativeSignals: llmResult.negativeSignals,
            generatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[DailyReport] Report saved for user ${userId} on ${today}`);
    return { report, hasPortfolio: true };
}

/**
 * Returns today's stored report for a specific user, or null if not yet generated.
 *
 * @param {string} userId — MongoDB ObjectId of the requesting user
 */
export async function getTodayReport(userId) {
    const today = todayDateString();
    return DailyReport.findOne({ userId, date: today }).sort({ generatedAt: -1 }).lean();
}
