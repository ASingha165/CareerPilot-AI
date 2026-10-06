import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = auth;

    // Safety check: Do not allow removing the only authentication method!
    if (!user.passwordHash || !user.salt) {
      return NextResponse.json(
        {
          error:
            "Cannot disconnect Google because it is your only sign-in method. Please set a password before disconnecting Google.",
        },
        { status: 400 }
      );
    }

    if (!user.googleId) {
      return NextResponse.json(
        { error: "Google account is not connected." },
        { status: 400 }
      );
    }

    // Disconnect Google identity
    db.users.update(user.id, {
      googleId: null,
      authProvider: "password",
    });

    db.activities.add(
      user.id,
      "Google Account Disconnected",
      "Disconnected Google account from profile",
      "profile_created"
    );

    const fullProfile = db.getFullProfile(user.id);

    return NextResponse.json({
      success: true,
      message: "Google account disconnected successfully.",
      profile: fullProfile,
    });
  } catch (error) {
    console.error("[API /auth/disconnect-google] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google account." },
      { status: 500 }
    );
  }
}
