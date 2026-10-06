import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, category, proficiency, experienceYears } = body;

    const updated = db.skills.update(id, auth.user.id, {
      ...(name ? { name: name.trim() } : {}),
      ...(category ? { category: category.trim() } : {}),
      ...(proficiency ? { proficiency } : {}),
      ...(experienceYears !== undefined ? { experienceYears: Number(experienceYears) } : {}),
    });

    if (!updated) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    db.activities.add(
      auth.user.id,
      "Skill Updated",
      `Updated "${updated.name}" proficiency to ${updated.proficiency}`,
      "skill_updated"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, skill: updated, profile: fullProfile });
  } catch (error) {
    console.error("[API /skills/[id] PUT] Error:", error);
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const allSkills = db.skills.findByUserId(auth.user.id);
    const existing = allSkills.find((s) => s.id === id);

    const deleted = db.skills.delete(id, auth.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    if (existing) {
      db.activities.add(
        auth.user.id,
        "Skill Removed",
        `Removed "${existing.name}" from skill profile`,
        "skill_deleted"
      );
    }

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("[API /skills/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}
