/**
 * dailyReport.service.js
 * ─────────────────────────────────────────────────────────────────
 * Orchestrates:
 *   1. News fetching from NewsAPI (four categories, top-10 total)
 *   2. Portfolio holdings from MongoDB
 *   3. LLM structured analysis (Groq Llama 3)
 *   4. Persistence to DailyReport collection (idempotent)
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

// ── 2. Portfolio Holdings ────────────────────────────────────────

/**
 * Returns all holdings across every user as { symbol, sector }[].
 * We aggregate across all portfolios so the report is market-wide.
 */
async function fetchAllHoldings() {
    try {
        const portfolios = await Portfolio.find({});
        const seen = new Set();
        const holdings = [];

        for (const p of portfolios) {
            for (const stock of p.stocks) {
                if (seen.has(stock.symbol)) continue;
                seen.add(stock.symbol);

                // Try to get sector info from market service
                let sector = "Unknown";
                try {
                    const live = await getLivePrice(stock.symbol);
                    if (live?.sector) sector = live.sector;
                } catch {
                    // ignore — sector is optional
                }

                holdings.push({ symbol: stock.symbol, sector });
            }
        }

        return holdings;
    } catch {
        return [];
    }
}

// ── 3. LLM Processing ───────────────────────────────────────────

/**
 * Sends structured context to Groq and returns parsed JSON.
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
- Match headlines to portfolio stocks where relevant; if no match use a relevant sector ETF ticker (e.g. XLK, XLE)
- FOR EACH SIGNAL, YOU MUST INCLUDE THE EXACT URL FROM THE NEWS HEADLINE PROVIDED
- Include 2 to 4 entries per signal list
- reason must be 2-3 sentences explaining the market impact
- suggestedAction must be one of: Buy, Hold, Sell, Add, Reduce, Watch
- Respond with ONLY the JSON — nothing else`;

    const userPrompt = `Today's Portfolio Holdings:\n${holdingLines}\n\nTop 10 Market Headlines:\n${headlineLines}\n\nGenerate the daily market signal report.`;

    const response = await getGroqClient().chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
    });

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
 * Generates (or retrieves) today's daily report.
 *
 * @param {boolean} force  If true, regenerate even if today's report exists
 * @returns {Promise<DailyReport>}
 */
export async function generateDailyReport(force = false) {
    const today = todayDateString();

    // Idempotency guard
    if (!force) {
        // Also fetch the latest one if multiples were generated concurrently
        const existing = await DailyReport.findOne({ date: today }).sort({ generatedAt: -1 });
        if (existing) {
            console.log(`[DailyReport] Report for ${today} already exists — skipping`);
            return existing;
        }
    }

    console.log(`[DailyReport] Generating report for ${today} …`);

    const [headlines, holdings] = await Promise.all([
        fetchTopHeadlines(),
        fetchAllHoldings(),
    ]);

    console.log(`[DailyReport] Fetched ${headlines.length} headlines, ${holdings.length} holdings`);

    const llmResult = await callLLM(headlines, holdings);

    console.log(
        `[DailyReport] LLM returned ${llmResult.positiveSignals.length} positive, ${llmResult.negativeSignals.length} negative signals`
    );

    // Upsert — replace if force, otherwise insert
    const report = await DailyReport.findOneAndUpdate(
        { date: today },
        {
            date: today,
            positiveSignals: llmResult.positiveSignals,
            negativeSignals: llmResult.negativeSignals,
            generatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[DailyReport] Report saved for ${today}`);
    return report;
}

/**
 * Returns today's stored report, or null if not yet generated.
 */
export async function getTodayReport() {
    const today = todayDateString();
    return DailyReport.findOne({ date: today }).sort({ generatedAt: -1 }).lean();
}
