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
      name,
      issuingOrganization,
      issueDate,
      expirationDate,
      credentialId,
      credentialUrl,
      documentUrl,
      relatedSkills,
    } = body;

    if (!name || !issuingOrganization) {
      return NextResponse.json(
        { error: "Certification name and issuing organization are required" },
        { status: 400 }
      );
    }

    const cert = db.certifications.create({
      userId: auth.user.id,
      name: name.trim(),
      issuingOrganization: issuingOrganization.trim(),
      issueDate: issueDate || new Date().toISOString().split("T")[0],
      expirationDate: expirationDate || undefined,
      credentialId: credentialId?.trim() || undefined,
      credentialUrl: credentialUrl?.trim() || undefined,
      documentUrl: documentUrl?.trim() || undefined,
      relatedSkills: Array.isArray(relatedSkills) ? relatedSkills : [],
    });

    db.activities.add(
      auth.user.id,
      "Certification Added",
      `Earned ${cert.name} from ${cert.issuingOrganization}`,
      "certification_added"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, certification: cert, profile: fullProfile });
  } catch (error) {
    console.error("[API /certifications POST] Error:", error);
    return NextResponse.json({ error: "Failed to add certification" }, { status: 500 });
  }
}
