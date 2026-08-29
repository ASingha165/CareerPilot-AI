import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { generateInterviewQuestions, MOCK_QUESTIONS } from "@/lib/ai/interview-service";
import type { InterviewType, Difficulty } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, type, difficulty, profileSummary } = body as {
      role: string;
      type: InterviewType;
      difficulty: Difficulty;
      profileSummary: string;
    };

    if (!role || !type || !difficulty) {
      return NextResponse.json(
        { error: "role, type, and difficulty are required" },
        { status: 400 }
      );
    }

    let questions;
    if (isGeminiConfigured()) {
      questions = await generateInterviewQuestions(
        role,
        type,
        difficulty,
        profileSummary || ""
      );
    } else {
      questions = MOCK_QUESTIONS;
    }

    return NextResponse.json({
      success: true,
      questions,
      isMock: !isGeminiConfigured(),
    });
  } catch (error) {
    console.error("[API /interview/generate] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate interview questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
