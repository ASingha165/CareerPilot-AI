import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function getSkillLevelLabel(level: number): string {
  if (level >= 80) return "Strong";
  if (level >= 60) return "Developing";
  if (level >= 40) return "Needs Work";
  if (level >= 20) return "Beginner";
  return "Not Started";
}

export function getSkillLevelColor(level: number): string {
  if (level >= 80) return "bg-emerald-500";
  if (level >= 60) return "bg-blue-500";
  if (level >= 40) return "bg-yellow-500";
  if (level >= 20) return "bg-orange-500";
  return "bg-red-500";
}

export function getSkillLevelTextColor(level: number): string {
  if (level >= 80) return "text-emerald-400";
  if (level >= 60) return "text-blue-400";
  if (level >= 40) return "text-yellow-400";
  if (level >= 20) return "text-orange-400";
  return "text-red-400";
}

export function getReadinessLabel(score: number): string {
  if (score >= 85) return "Career Ready";
  if (score >= 70) return "Almost Ready";
  if (score >= 55) return "Getting There";
  if (score >= 40) return "Building Up";
  return "Early Stage";
}

export function getReadinessColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 55) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function getMatchColor(percent: number): string {
  if (percent >= 85) return "text-emerald-400";
  if (percent >= 70) return "text-blue-400";
  if (percent >= 55) return "text-yellow-400";
  return "text-orange-400";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function safeJsonParse<T>(text: string): T | null {
  if (!text || typeof text !== "string") return null;

  // 1. Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {}

  // 2. Strip simple markdown fences if present
  try {
    const trimmed = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(trimmed) as T;
  } catch {}

  // 3. Extract content inside any ```json ... ``` or ``` ... ``` block
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      return JSON.parse(match[1].trim()) as T;
    }
  } catch {}

  // 4. Extract between outermost { ... } or [ ... ]
  try {
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");
    let start = -1;
    let end = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = text.lastIndexOf("}");
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = text.lastIndexOf("]");
    }
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
  } catch {}

  return null;
}
