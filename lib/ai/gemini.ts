import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

const FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[CareerPilot] GEMINI_API_KEY is not set. AI features will use fallback mock responses."
  );
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export function getGeminiModel(modelName = DEFAULT_GEMINI_MODEL) {
  if (!genAI) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add it to .env.local"
    );
  }
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async generateContent(prompt: string | any[]) {
      const contents = Array.isArray(prompt) ? prompt : prompt;
      const candidateModels = [
        modelName,
        ...(modelName === DEFAULT_GEMINI_MODEL ? FALLBACK_MODELS : []),
      ];

      let lastError: unknown;

      for (let i = 0; i < candidateModels.length; i++) {
        const currentModel = candidateModels[i];
        try {
          const response = await genAI.models.generateContent({
            model: currentModel,
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
        } catch (error: unknown) {
          lastError = error;
          const errorMessage =
            error instanceof Error ? error.message : JSON.stringify(error);
          const errorStatus =
            typeof error === "object" && error !== null && "status" in error
              ? (error as { status: number }).status
              : 0;

          const isUnavailable =
            errorStatus === 404 ||
            errorStatus === 503 ||
            errorStatus === 429 ||
            errorMessage.includes("404") ||
            errorMessage.includes("503") ||
            errorMessage.includes("429") ||
            errorMessage.includes("not found") ||
            errorMessage.includes("no longer available") ||
            errorMessage.includes("is not found for API version") ||
            errorMessage.includes("high demand") ||
            errorMessage.includes("UNAVAILABLE") ||
            errorMessage.includes("RESOURCE_EXHAUSTED");

          if (isUnavailable && i < candidateModels.length - 1) {
            console.warn(
              `[CareerPilot] Model "${currentModel}" unavailable (${errorMessage}). Falling back to "${candidateModels[i + 1]}"...`
            );
            continue;
          }

          throw error;
        }
      }

      throw lastError;
    },
  };
}

export function isGeminiConfigured(): boolean {
  return !!genAI;
}

