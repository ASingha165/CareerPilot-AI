import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { analyzeResume, MOCK_RESUME_ANALYSIS } from "@/lib/ai/resume-analyzer";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    const profileJson = formData.get("profile") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".txt")) {
      return NextResponse.json(
        { error: "Only PDF and TXT files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 5MB" },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let resumeText = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    } else {
      resumeText = buffer.toString("utf-8");
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from the file. Please ensure it is a readable PDF or text file." },
        { status: 422 }
      );
    }

    // Use AI or fall back to mock
    let analysis;
    if (isGeminiConfigured()) {
      analysis = await analyzeResume(resumeText, profileJson || undefined);
    } else {
      // Mock mode — clearly labeled
      analysis = { ...MOCK_RESUME_ANALYSIS, _isMock: true };
    }

    return NextResponse.json({
      success: true,
      analysis,
      rawText: resumeText.slice(0, 2000), // Return truncated raw text for client display
      fileName: file.name,
      isMock: !isGeminiConfigured(),
    });
  } catch (error) {
    console.error("[API /resume] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
