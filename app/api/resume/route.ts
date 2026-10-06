import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { analyzeResume, MOCK_RESUME_ANALYSIS } from "@/lib/ai/resume-analyzer";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resumes = db.resumes.findByUserId(auth.user.id);
    return NextResponse.json({ success: true, resumes });
  } catch (error) {
    console.error("[API /resume GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    const profileJson = formData.get("profile") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileNameLower = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileNameLower.endsWith(".pdf");
    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileNameLower.endsWith(".docx") ||
      fileNameLower.endsWith(".doc");
    const isTxt =
      file.type === "text/plain" ||
      fileNameLower.endsWith(".txt");

    if (!isPdf && !isDocx && !isTxt) {
      return NextResponse.json(
        { error: "Only PDF, DOCX, and TXT files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 8MB" },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let resumeText = "";

    if (isPdf) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text || "";
    } else if (isDocx) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      resumeText = result.value || "";
    } else {
      resumeText = buffer.toString("utf-8");
    }

    if (!resumeText || resumeText.trim().length < 40) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from this document. Please ensure the file is not empty or password protected.",
        },
        { status: 422 }
      );
    }

    let analysis: import("@/lib/types").ResumeAnalysis;
    if (isGeminiConfigured()) {
      analysis = await analyzeResume(resumeText, profileJson || undefined);
    } else {
      analysis = MOCK_RESUME_ANALYSIS;
    }

    let resumeRecord = null;
    let fullProfile = null;

    if (auth) {
      resumeRecord = db.resumes.create({
        userId: auth.user.id,
        fileName: file.name,
        fileType: isPdf ? "pdf" : isDocx ? "docx" : "txt",
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        status: "analyzed",
        analysis,
        rawText: resumeText.slice(0, 4000),
      });

      db.activities.add(
        auth.user.id,
        "Resume Uploaded",
        `Uploaded and analyzed resume: ${file.name}`,
        "resume_uploaded"
      );

      fullProfile = db.getFullProfile(auth.user.id);
    }

    return NextResponse.json({
      success: true,
      analysis,
      rawText: resumeText.slice(0, 2000),
      fileName: file.name,
      fileSize: file.size,
      resumeRecord,
      profile: fullProfile,
      isMock: !isGeminiConfigured(),
    });
  } catch (error) {
    console.error("[API /resume POST] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
