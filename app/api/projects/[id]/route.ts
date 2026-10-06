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
    const updated = db.projects.update(id, auth.user.id, body);

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    db.activities.add(
      auth.user.id,
      "Project Updated",
      `Updated project "${updated.name}" details`,
      "project_updated"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, project: updated, profile: fullProfile });
  } catch (error) {
    console.error("[API /projects/[id] PUT] Error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
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
    const existing = db.projects.findByUserId(auth.user.id).find((p) => p.id === id);

    const deleted = db.projects.delete(id, auth.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (existing) {
      db.activities.add(
        auth.user.id,
        "Project Removed",
        `Removed project "${existing.name}"`,
        "project_deleted"
      );
    }

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("[API /projects/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
