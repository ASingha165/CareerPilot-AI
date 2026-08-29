import { getGeminiModel } from "@/lib/ai/gemini";
import { READINESS_SCORE_PROMPT } from "@/lib/ai/prompts";
import { safeJsonParse } from "@/lib/utils";
import type { ReadinessScore } from "@/lib/types";

export const MOCK_READINESS_SCORE: ReadinessScore = {
  overall: 62,
  breakdown: {
    technicalSkills: 70,
    projects: 65,
    experience: 30,
    certifications: 55,
    resumeQuality: 62,
    githubActivity: 0,
    interviewReadiness: 25,
  },
  label: "Getting There",
  explanation:
    "You have a solid technical foundation with Python and ML skills, but lack professional experience and production projects. Connecting GitHub and completing mock interviews would significantly boost your readiness.",
  topImprovements: [
    "Deploy at least one project and link it on your resume",
    "Complete 5+ mock interviews to build interview readiness",
    "Connect your GitHub profile to showcase your actual code",
  ],
};

export async function calculateReadinessScore(
  profile: string,
  resumeAnalysis: string,
  interviewHistory: string,
  githubSummary: string
): Promise<ReadinessScore> {
  const model = getGeminiModel();
  const prompt = READINESS_SCORE_PROMPT(
    profile,
    resumeAnalysis,
    interviewHistory,
    githubSummary
  );

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = safeJsonParse<ReadinessScore>(text);
  if (!parsed) {
    throw new Error("Failed to parse readiness score from AI");
  }

  return parsed;
}
