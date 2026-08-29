import { NextRequest, NextResponse } from "next/server";
import { analyzeGitHubProfile } from "@/lib/github/analyzer";
import { isGeminiConfigured } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body as { username: string };

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 }
      );
    }

    const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");
    if (!sanitizedUsername) {
      return NextResponse.json(
        { error: "Invalid GitHub username" },
        { status: 400 }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        success: true,
        analysis: null,
        isMock: true,
        message: "GitHub analysis requires GEMINI_API_KEY to be configured",
      });
    }

    const analysis = await analyzeGitHubProfile(sanitizedUsername);

    return NextResponse.json({
      success: true,
      analysis,
      isMock: false,
    });
  } catch (error) {
    console.error("[API /github] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze GitHub profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
