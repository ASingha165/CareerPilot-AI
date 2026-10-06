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
    const updated = db.certifications.update(id, auth.user.id, body);

    if (!updated) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, certification: updated, profile: fullProfile });
  } catch (error) {
    console.error("[API /certifications/[id] PUT] Error:", error);
    return NextResponse.json({ error: "Failed to update certification" }, { status: 500 });
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
    const deleted = db.certifications.delete(id, auth.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("[API /certifications/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete certification" }, { status: 500 });
  }
}
