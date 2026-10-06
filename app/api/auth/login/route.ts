import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.users.findByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid =
      user.passwordHash && user.salt
        ? verifyPassword(password, user.salt, user.passwordHash)
        : false;

    if (!user.passwordHash || !user.salt) {
      return NextResponse.json(
        {
          error:
            "This account was created with Google. Please click 'Continue with Google' to sign in.",
          isGoogleAccount: true,
        },
        { status: 400 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const { token, expiresAt } = createSession(user.id);
    const fullProfile = db.getFullProfile(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId || null,
        avatar: user.avatar || null,
        authProvider:
          user.authProvider ||
          (user.googleId ? (user.passwordHash ? "google+password" : "google") : "password"),
        createdAt: user.createdAt,
      },
      profile: fullProfile,
    });

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
    console.error("[API /auth/login] Error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
