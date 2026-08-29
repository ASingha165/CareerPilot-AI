import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { recommendCareers, MOCK_RECOMMENDATIONS } from "@/lib/ai/career-recommender";
import type { CareerProfile, ResumeAnalysis } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, resumeAnalysis } = body as {
      profile: CareerProfile;
      resumeAnalysis: ResumeAnalysis;
    };

    if (!profile || !resumeAnalysis) {
      return NextResponse.json(
        { error: "Profile and resume analysis are required" },
        { status: 400 }
      );
    }

    let recommendations;
    if (isGeminiConfigured()) {
      recommendations = await recommendCareers(profile, resumeAnalysis);
    } else {
      recommendations = MOCK_RECOMMENDATIONS;
    }

    return NextResponse.json({
      success: true,
      recommendations,
      isMock: !isGeminiConfigured(),
    });
  } catch (error) {
    console.error("[API /career-recommend] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
