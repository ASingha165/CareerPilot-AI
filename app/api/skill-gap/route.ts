import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { analyzeSkillGap, MOCK_ROADMAP } from "@/lib/ai/skill-gap-analyzer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetRole, currentSkills, resumeAnalysisSummary } = body as {
      targetRole: string;
      currentSkills: string[];
      resumeAnalysisSummary: string;
    };

    if (!targetRole) {
      return NextResponse.json(
        { error: "Target role is required" },
        { status: 400 }
      );
    }

    let roadmap;
    if (isGeminiConfigured()) {
      roadmap = await analyzeSkillGap(
        targetRole,
        currentSkills || [],
        resumeAnalysisSummary || ""
      );
    } else {
      roadmap = { ...MOCK_ROADMAP, targetRole };
    }

    return NextResponse.json({
      success: true,
      roadmap,
      isMock: !isGeminiConfigured(),
    });
  } catch (error) {
    console.error("[API /skill-gap] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze skill gap";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
