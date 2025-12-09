import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCs2O-W9G_2gzc3nG6-TJj7NR6pAqvM19s";
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) {
            console.error("API Error:", data.error);
        } else {
            console.log("Available Models:");
            (data.models || []).forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        }
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

listModels();
