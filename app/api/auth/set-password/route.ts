import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = auth;
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // If user already has a password set, require verifying current password
    if (user.passwordHash && user.salt) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password." },
          { status: 400 }
        );
      }

      const isValid = verifyPassword(currentPassword, user.salt, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 401 }
        );
      }
    }

    // Hash new password
    const { salt, hash } = hashPassword(newPassword);
    const newAuthProvider = user.googleId ? "google+password" : "password";

    db.users.update(user.id, {
      passwordHash: hash,
      salt,
      authProvider: newAuthProvider,
    });

    db.activities.add(
      user.id,
      user.passwordHash ? "Password Changed" : "Password Created",
      user.passwordHash
        ? "Updated account security password"
        : "Enabled password authentication alongside Google",
      "profile_created"
    );

    const fullProfile = db.getFullProfile(user.id);

    return NextResponse.json({
      success: true,
      message: user.passwordHash
        ? "Password changed successfully."
        : "Password enabled! You can now sign in with either Google or email & password.",
      profile: fullProfile,
    });
  } catch (error) {
    console.error("[API /auth/set-password] Error:", error);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }
}
