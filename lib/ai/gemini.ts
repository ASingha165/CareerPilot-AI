import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[CareerPilot] GEMINI_API_KEY is not set. AI features will use fallback mock responses."
  );
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export function getGeminiModel(modelName = "gemini-1.5-flash") {
  if (!genAI) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add it to .env.local"
    );
  }
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async generateContent(prompt: string | any[]) {
      const contents = Array.isArray(prompt) ? prompt : prompt;
      const response = await genAI.models.generateContent({
        model: modelName,
        contents,
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          responseMimeType: "application/json",
        },
      });
      return {
        response: {
          text: (): string => response.text || "",
        },
      };
    },
  };
}

export function isGeminiConfigured(): boolean {
  return !!genAI;
}
