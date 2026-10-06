import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { verifyPendingLinkToken, LINK_TOKEN_COOKIE_NAME } from "@/lib/auth/google";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const linkCookie = request.cookies.get(LINK_TOKEN_COOKIE_NAME)?.value;
    if (!linkCookie) {
      return NextResponse.json(
        { error: "Account linking session expired or missing. Please try signing in with Google again." },
        { status: 400 }
      );
    }

    const payload = verifyPendingLinkToken(linkCookie);
    if (!payload) {
      return NextResponse.json(
        { error: "Account linking session has expired. Please try signing in with Google again." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Please enter your existing account password to confirm ownership." },
        { status: 400 }
      );
    }

    const user = db.users.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    // Verify existing account password
    const isPasswordValid = verifyPassword(password, user.salt || "", user.passwordHash || "");
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please verify the password for your existing account." },
        { status: 401 }
      );
    }

    // Securely link Google identity
    db.users.update(user.id, {
      googleId: payload.googleId,
      avatar: user.avatar || payload.avatar || null,
      authProvider: "google+password",
    });

    // Update avatar in profile if not already set
    const profile = db.profiles.findByUserId(user.id);
    if (profile && !profile.personal.avatarUrl && payload.avatar) {
      db.profiles.update(user.id, {
        personal: {
          ...profile.personal,
          avatarUrl: payload.avatar,
        },
      });
    }

    db.activities.add(
      user.id,
      "Google Account Linked",
      `Linked Google account (${payload.googleEmail}) to existing account`,
      "profile_created"
    );

    // Create session
    const { token, expiresAt } = createSession(user.id);
    const fullProfile = db.getFullProfile(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Google account successfully linked!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: payload.googleId,
        avatar: user.avatar || payload.avatar || null,
        authProvider: "google+password",
        createdAt: user.createdAt,
      },
      profile: fullProfile,
    });

    // Clear pending link cookie
    response.cookies.delete(LINK_TOKEN_COOKIE_NAME);

    // Set authenticated session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(expiresAt),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[API /auth/link-google] Error linking Google account:", error);
    return NextResponse.json(
      { error: "Failed to link Google account. Please try again." },
      { status: 500 }
    );
  }
}
