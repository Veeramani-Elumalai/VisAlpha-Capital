import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";

// Manually load .env since we are running as a standalone script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

async function testGroq() {
    console.log("🚀 Testing Groq Integration...");

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === "your_groq_api_key") {
        console.error("❌ Error: GROQ_API_KEY is missing or contains the placeholder value in .env");
        process.exit(1);
    }

    console.log(`📡 Using API Key: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);

    const groq = new Groq({ apiKey });

    try {
        console.log("⏳ Sending request to llama-3.3-70b-versatile...");
        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Say 'Hello from Groq! The integration is successful.' if you can read this." }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
        });

        const content = response.choices[0]?.message?.content;

        if (content) {
            console.log("\n✅ SUCCESS! Groq Response:");
            console.log("-----------------------------------------");
            console.log(content);
            console.log("-----------------------------------------");
        } else {
            console.error("❌ Error: Groq returned an empty response.");
        }
    } catch (error) {
        console.error("\n❌ Error during Groq API call:");
        console.error(error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testGroq();
