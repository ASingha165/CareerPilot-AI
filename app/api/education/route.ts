import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { institution, degree, fieldOfStudy, startYear, endYear, grade, coursework } = body;

    if (!institution || !degree) {
      return NextResponse.json({ error: "Institution and degree are required" }, { status: 400 });
    }

    const edu = db.education.create({
      userId: auth.user.id,
      institution: institution.trim(),
      degree: degree.trim(),
      fieldOfStudy: fieldOfStudy?.trim() || "General",
      startYear: Number(startYear) || new Date().getFullYear() - 4,
      endYear: Number(endYear) || new Date().getFullYear(),
      grade: grade?.trim() || undefined,
      coursework: Array.isArray(coursework) ? coursework : coursework ? [coursework] : undefined,
    });

    db.activities.add(
      auth.user.id,
      "Education Added",
      `Added ${edu.degree} at ${edu.institution}`,
      "profile_created"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, education: edu, profile: fullProfile });
  } catch (error) {
    console.error("[API /education POST] Error:", error);
    return NextResponse.json({ error: "Failed to add education" }, { status: 500 });
  }
}
