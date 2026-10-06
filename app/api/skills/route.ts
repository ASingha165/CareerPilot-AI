import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skills = db.skills.findByUserId(auth.user.id);
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    console.error("[API /skills GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, proficiency, experienceYears, source } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
    }

    const { skill, isDuplicate } = db.skills.create({
      userId: auth.user.id,
      name: name.trim(),
      category: category?.trim() || "Technical",
      proficiency: proficiency || "intermediate",
      experienceYears: experienceYears ? Number(experienceYears) : undefined,
      source: source || "manual",
    });

    if (isDuplicate) {
      return NextResponse.json(
        { error: `Skill "${name.trim()}" already exists in your profile`, isDuplicate: true },
        { status: 409 }
      );
    }

    db.activities.add(
      auth.user.id,
      "Skill Added",
      `Added "${skill.name}" (${skill.proficiency}) to skill profile`,
      "skill_added"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, skill, profile: fullProfile });
  } catch (error) {
    console.error("[API /skills POST] Error:", error);
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}
