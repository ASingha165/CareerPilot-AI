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
    const {
      title,
      description,
      date,
      issuingOrganization,
      credentialUrl,
      documentUrl,
      skills,
      tags,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const ach = db.achievements.create({
      userId: auth.user.id,
      title: title.trim(),
      description: description.trim(),
      date: date || new Date().toISOString().split("T")[0],
      issuingOrganization: issuingOrganization?.trim() || undefined,
      credentialUrl: credentialUrl?.trim() || undefined,
      documentUrl: documentUrl?.trim() || undefined,
      skills: Array.isArray(skills) ? skills : [],
      tags: Array.isArray(tags) ? tags : [],
    });

    db.activities.add(
      auth.user.id,
      "Achievement Added",
      `Added achievement "${ach.title}"`,
      "achievement_added"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, achievement: ach, profile: fullProfile });
  } catch (error) {
    console.error("[API /achievements POST] Error:", error);
    return NextResponse.json({ error: "Failed to add achievement" }, { status: 500 });
  }
}
