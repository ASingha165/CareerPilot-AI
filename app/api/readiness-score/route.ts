import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { calculateReadinessScore, MOCK_READINESS_SCORE } from "@/lib/ai/readiness-scorer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, resumeAnalysis, interviewHistory, githubSummary } = body as {
      profile: string;
      resumeAnalysis: string;
      interviewHistory: string;
      githubSummary: string;
    };

    if (!profile) {
      return NextResponse.json({ error: "Profile is required" }, { status: 400 });
    }

    let score;
    if (isGeminiConfigured()) {
      score = await calculateReadinessScore(
        profile,
        resumeAnalysis || "",
        interviewHistory || "",
        githubSummary || ""
      );
    } else {
      score = MOCK_READINESS_SCORE;
    }

    return NextResponse.json({
      success: true,
      score,
      isMock: !isGeminiConfigured(),
    });
  } catch (error) {
    console.error("[API /readiness-score] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to calculate readiness score";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
