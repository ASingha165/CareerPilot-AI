import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 401 });
    }

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        googleId: auth.user.googleId || null,
        avatar: auth.user.avatar || null,
        authProvider:
          auth.user.authProvider ||
          (auth.user.googleId
            ? auth.user.passwordHash
              ? "google+password"
              : "google"
            : "password"),
        createdAt: auth.user.createdAt,
      },
      profile: fullProfile,
    });
  } catch (error) {
    console.error("[API /auth/me] Error:", error);
    return NextResponse.json({ error: "Failed to get user session" }, { status: 500 });
  }
}
