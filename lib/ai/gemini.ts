import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[CareerPilot] GEMINI_API_KEY is not set. AI features will use fallback mock responses."
  );
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export function getGeminiModel(modelName = "gemini-1.5-flash") {
  if (!genAI) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add it to .env.local"
    );
  }
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });
}

export function isGeminiConfigured(): boolean {
  return !!genAI;
}
