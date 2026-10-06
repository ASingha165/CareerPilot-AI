import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      password,
      institution,
      degree,
      fieldOfStudy,
      graduationYear,
      careerGoals,
      targetRole,
    } = body;

    // Validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Full name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.users.findByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const { salt, hash } = hashPassword(password);
    const userId = `user_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    // Create User
    const user = db.users.create({
      id: userId,
      email: cleanEmail,
      name: fullName.trim(),
      passwordHash: hash,
      salt,
      createdAt: now,
      updatedAt: now,
    });

    // Create Profile
    db.profiles.create({
      userId,
      personal: {
        fullName: fullName.trim(),
        email: cleanEmail,
        bio: careerGoals?.trim() || "",
      },
      careerPreferences: {
        targetRoles: targetRole ? [targetRole.trim()] : ["Software Developer"],
        preferredIndustry: "Technology",
        preferredWorkType: "hybrid",
        preferredLocation: "Flexible",
        careerInterests: targetRole ? [targetRole.trim()] : [],
      },
      createdDate: now,
      lastProfileUpdate: now,
      lastAiAnalysisDate: null,
      lastResumeUpdate: null,
      lastGithubAnalysis: null,
      isAiAnalysisStale: false,
    });

    // If optional education provided, create Education record
    if (institution && institution.trim()) {
      db.education.create({
        userId,
        institution: institution.trim(),
        degree: degree?.trim() || "Undergraduate Degree",
        fieldOfStudy: fieldOfStudy?.trim() || "Computer Science",
        startYear: graduationYear ? Number(graduationYear) - 4 : new Date().getFullYear() - 3,
        endYear: graduationYear ? Number(graduationYear) : new Date().getFullYear() + 1,
      });
    }

    // Log initial activity
    db.activities.add(
      userId,
      "Account Created",
      "Created CareerPilot career profile",
      "profile_created"
    );

    // Create session
    const { token, expiresAt } = createSession(userId);

    const fullProfile = db.getFullProfile(userId);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      profile: fullProfile,
    });

    // Set HTTP-only cookie
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
    console.error("[API /auth/signup] Error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
