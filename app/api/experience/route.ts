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
      type,
      organization,
      position,
      description,
      startDate,
      endDate,
      isCurrent,
      technologies,
      achievements,
    } = body;

    if (!organization || !position) {
      return NextResponse.json(
        { error: "Organization and position are required" },
        { status: 400 }
      );
    }

    const exp = db.experience.create({
      userId: auth.user.id,
      type: type || "internship",
      organization: organization.trim(),
      position: position.trim(),
      description: description?.trim() || "",
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: isCurrent ? undefined : endDate,
      isCurrent: Boolean(isCurrent),
      technologies: Array.isArray(technologies) ? technologies : [],
      achievements: Array.isArray(achievements) ? achievements : [],
    });

    db.activities.add(
      auth.user.id,
      "Experience Added",
      `Added ${exp.position} role at ${exp.organization}`,
      "experience_added"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, experience: exp, profile: fullProfile });
  } catch (error) {
    console.error("[API /experience POST] Error:", error);
    return NextResponse.json({ error: "Failed to add experience" }, { status: 500 });
  }
}
