import {
  GoogleGenAI,
  type ContentListUnion,
  type GenerateContentConfig,
} from "@google/genai";

export const PRIMARY_GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

export const FALLBACK_GEMINI_MODEL = "gemini-flash-lite-latest";

export const DEFAULT_GEMINI_MODEL = PRIMARY_GEMINI_MODEL;

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[CareerPilot] GEMINI_API_KEY is not set. AI features will use fallback mock responses."
  );
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

function sanitizeError(error: unknown): string {
  const apiKey = process.env.GEMINI_API_KEY;
  let str = "";
  if (error instanceof Error) {
    str = `${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    str = error;
  } else {
    try {
      str = JSON.stringify(error);
    } catch {
      str = String(error);
    }
  }
  if (apiKey && apiKey.length > 5) {
    str = str.replaceAll(apiKey, "[REDACTED_API_KEY]");
  }
  return str;
}

function isTransientError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const status =
      "status" in error && typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : "code" in error && typeof (error as { code: unknown }).code === "number"
        ? (error as { code: number }).code
        : null;

    if (status === 503 || status === 429 || status === 500 || status === 504) {
      return true;
    }
  }

  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("504") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("high demand") ||
    msg.includes("rate limit") ||
    msg.includes("overloaded") ||
    msg.includes("fetch failed") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT")
  );
}

function isPermanentError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const status =
      "status" in error && typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : "code" in error && typeof (error as { code: unknown }).code === "number"
        ? (error as { code: number }).code
        : null;

    if (status === 400 || status === 401 || status === 403) {
      return true;
    }
  }

  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  return (
    msg.includes("API key not valid") ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("INVALID_ARGUMENT") ||
    msg.includes("AUTHENTICATION_FAILED")
  );
}

function isModelUnavailable(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const status =
      "status" in error && typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : null;
    if (status === 404) return true;
  }

  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  return (
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("no longer available") ||
    msg.includes("is not found for API version")
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getGeminiModel(modelName = DEFAULT_GEMINI_MODEL) {
  if (!genAI) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add it to .env.local"
    );
  }

  return {
    async generateContent(prompt: ContentListUnion, configOverride?: GenerateContentConfig) {
      const contents = prompt;

      const candidateList: string[] = [modelName];
      if (!candidateList.includes(FALLBACK_GEMINI_MODEL)) {
        candidateList.push(FALLBACK_GEMINI_MODEL);
      }

      const modelStages = candidateList.map((m, index) => {
        const isPrimary = index === 0;
        return {
          model: m,
          maxRetries: isPrimary ? 3 : 2,
          delays: isPrimary ? [1000, 2000, 4000] : [1000, 2000],
          isPrimary,
        };
      });

      let lastError: unknown;

      for (const stage of modelStages) {
        let attempt = 0;
        while (attempt <= stage.maxRetries) {
          try {
            const response = await genAI.models.generateContent({
              model: stage.model,
              contents,
              config: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                responseMimeType: "application/json",
                ...configOverride,
              },
            });

            return {
              response: {
                text: (): string => response.text || "",
              },
            };
          } catch (err: unknown) {
            lastError = err;
            const sanitized = sanitizeError(err);

            if (isPermanentError(err)) {
              console.error(
                `[CareerPilot] Permanent error on model "${stage.model}": ${sanitized}. Not retrying.`
              );
              throw new Error(
                "AI analysis is temporarily unavailable. Please try again in a moment."
              );
            }

            if (isModelUnavailable(err)) {
              console.warn(
                `[CareerPilot] Model "${stage.model}" is unavailable on this API key: ${sanitized}. Moving to fallback model.`
              );
              break;
            }

            if (isTransientError(err)) {
              if (attempt < stage.maxRetries) {
                const delay = stage.delays[attempt] || 1000;
                console.warn(
                  `[CareerPilot] Transient error on model "${stage.model}". Retrying in ${delay}ms (attempt ${
                    attempt + 1
                  }/${stage.maxRetries})...`
                );
                await sleep(delay);
                attempt++;
                continue;
              } else {
                console.warn(
                  `[CareerPilot] Max retries (${stage.maxRetries}) exhausted for model "${stage.model}". Moving to fallback.`
                );
                break;
              }
            }

            console.warn(
              `[CareerPilot] Unexpected error on model "${stage.model}": ${sanitized}. Moving to fallback.`
            );
            break;
          }
        }
      }

      console.error(
        `[CareerPilot] All Gemini model attempts failed. Last technical error: ${sanitizeError(
          lastError
        )}`
      );
      throw new Error(
        "AI analysis is temporarily unavailable. Please try again in a moment."
      );
    },
  };
}

export function isGeminiConfigured(): boolean {
  return !!genAI;
}

export async function generateAiContent(
  prompt: ContentListUnion,
  configOverride?: GenerateContentConfig
): Promise<{ text: string }> {
  const model = getGeminiModel();
  const res = await model.generateContent(prompt, configOverride);
  return { text: res.response.text() };
}
