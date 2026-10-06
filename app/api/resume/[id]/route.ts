import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

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
    const deleted = db.resumes.delete(id, auth.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Resume record not found" }, { status: 404 });
    }

    db.activities.add(
      auth.user.id,
      "Resume Removed",
      "Removed resume document from profile",
      "resume_uploaded"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("[API /resume/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}
