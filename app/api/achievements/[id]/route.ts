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
    const updated = db.achievements.update(id, auth.user.id, body);

    if (!updated) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    }

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, achievement: updated, profile: fullProfile });
  } catch (error) {
    console.error("[API /achievements/[id] PUT] Error:", error);
    return NextResponse.json({ error: "Failed to update achievement" }, { status: 500 });
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
    const deleted = db.achievements.delete(id, auth.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    }

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("[API /achievements/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete achievement" }, { status: 500 });
  }
}
