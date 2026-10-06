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

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("[API /profile GET] Error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { personal, careerPreferences } = body;

    const currentProfile = auth.profile;
    const oldTarget = currentProfile.careerPreferences?.targetRoles?.[0];
    const newTarget = careerPreferences?.targetRoles?.[0];

    // Update user display name if changed
    if (personal?.fullName && personal.fullName.trim() !== auth.user.name) {
      db.users.update(auth.user.id, { name: personal.fullName.trim() });
    }

    // Update profile
    db.profiles.update(auth.user.id, {
      personal: {
        ...currentProfile.personal,
        ...(personal || {}),
        email: auth.user.email, // preserve authenticated email
      },
      careerPreferences: {
        ...currentProfile.careerPreferences,
        ...(careerPreferences || {}),
      },
    });

    // Check if target role changed meaningfully
    if (newTarget && newTarget !== oldTarget) {
      db.profiles.markAiStale(auth.user.id);
      db.activities.add(
        auth.user.id,
        "Career Goal Updated",
        `Target career role changed to ${newTarget}`,
        "career_goal_changed"
      );
    } else {
      db.activities.add(
        auth.user.id,
        "Profile Updated",
        "Updated personal and career preference information",
        "profile_created"
      );
    }

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("[API /profile PUT] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
