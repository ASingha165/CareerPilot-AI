import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  verifyOAuthState,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  createPendingLinkToken,
  OAUTH_STATE_COOKIE_NAME,
  LINK_TOKEN_COOKIE_NAME,
} from "@/lib/auth/google";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";
import { getBrowserUrl } from "@/lib/config/url";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const errorParam = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Handle user cancellation or OAuth errors from Google
  if (errorParam) {
    console.warn("[Google OAuth Callback] Google returned error:", errorParam);
    const redirectUrl = getBrowserUrl(
      errorParam === "access_denied" ? "/login?error=cancelled" : "/login?error=oauth_failed",
      request
    );
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }

  if (!code || !state) {
    const res = NextResponse.redirect(getBrowserUrl("/login?error=missing_code", request));
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }

  // 1. Verify OAuth state nonce cookie to defend against CSRF
  const cookieNonce = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const verification = verifyOAuthState(state, cookieNonce);

  if (!verification.valid || !verification.payload) {
    console.error("[Google OAuth Callback] State validation failed:", verification.error);
    const res = NextResponse.redirect(getBrowserUrl("/login?error=invalid_state", request));
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }

  const { mode, userId: stateUserId } = verification.payload;

  try {
    // 2. Server-side token exchange
    const { accessToken } = await exchangeCodeForTokens(code, request);

    // 3. Retrieve and validate verified userinfo from Google
    const userInfo = await getGoogleUserInfo(accessToken);

    if (!userInfo.emailVerified) {
      console.warn("[Google OAuth Callback] Unverified Google email:", userInfo.email);
      const res = NextResponse.redirect(getBrowserUrl("/login?error=unverified_email", request));
      res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      return res;
    }

    // -----------------------------------------------------------------
    // Mode A: User connecting Google account from profile settings
    // -----------------------------------------------------------------
    if (mode === "connect" && stateUserId) {
      const existingUser = db.users.findById(stateUserId);
      if (!existingUser) {
        const res = NextResponse.redirect(getBrowserUrl("/login?error=auth_required", request));
        res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
        return res;
      }

      // Check if this Google ID is already linked to ANOTHER user
      const existingLinked = db.users.findByGoogleId(userInfo.sub);
      if (existingLinked && existingLinked.id !== existingUser.id) {
        const res = NextResponse.redirect(
          getBrowserUrl("/profile?tab=security&error=google_already_linked", request)
        );
        res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
        return res;
      }

      // Link Google ID to existing user
      db.users.update(existingUser.id, {
        googleId: userInfo.sub,
        avatar: existingUser.avatar || userInfo.picture || null,
        authProvider: existingUser.passwordHash ? "google+password" : "google",
      });

      // Update avatar in profile if not already set
      const profile = db.profiles.findByUserId(existingUser.id);
      if (profile && !profile.personal.avatarUrl && userInfo.picture) {
        db.profiles.update(existingUser.id, {
          personal: {
            ...profile.personal,
            avatarUrl: userInfo.picture,
          },
        });
      }

      db.activities.add(
        existingUser.id,
        "Connected Google Account",
        `Successfully linked Google account (${userInfo.email})`,
        "profile_created"
      );

      const res = NextResponse.redirect(
        getBrowserUrl("/profile?tab=security&connected=google", request)
      );
      res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      return res;
    }

    // -----------------------------------------------------------------
    // Mode B: Sign-in / Sign-up flow
    // -----------------------------------------------------------------

    // Scenario B: User already linked to this Google account
    const existingGoogleUser = db.users.findByGoogleId(userInfo.sub);
    if (existingGoogleUser) {
      // Update avatar if provided and not present
      if (!existingGoogleUser.avatar && userInfo.picture) {
        db.users.update(existingGoogleUser.id, { avatar: userInfo.picture });
      }

      const { token, expiresAt } = createSession(existingGoogleUser.id);
      const res = NextResponse.redirect(getBrowserUrl("/dashboard", request));
      res.cookies.delete(OAUTH_STATE_COOKIE_NAME);

      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(expiresAt),
        path: "/",
      });

      return res;
    }

    // Scenario C: Email already exists with email/password authentication
    // DO NOT blindly create duplicate account or merge without password verification!
    const existingEmailUser = db.users.findByEmail(userInfo.email);
    if (existingEmailUser) {
      // If user has a password, require verification before linking
      if (existingEmailUser.passwordHash) {
        const pendingToken = createPendingLinkToken({
          userId: existingEmailUser.id,
          googleId: userInfo.sub,
          googleEmail: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.picture || null,
        });

        const linkUrl = getBrowserUrl("/login", request);
        linkUrl.searchParams.set("link", "required");
        linkUrl.searchParams.set("email", existingEmailUser.email);

        const res = NextResponse.redirect(linkUrl);
        res.cookies.delete(OAUTH_STATE_COOKIE_NAME);

        res.cookies.set({
          name: LINK_TOKEN_COOKIE_NAME,
          value: pendingToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 600, // 10 minutes
          path: "/",
        });

        return res;
      } else {
        // User had no password (e.g. earlier Google user without googleId somehow)
        db.users.update(existingEmailUser.id, {
          googleId: userInfo.sub,
          avatar: existingEmailUser.avatar || userInfo.picture || null,
          authProvider: "google",
        });

        const { token, expiresAt } = createSession(existingEmailUser.id);
        const res = NextResponse.redirect(getBrowserUrl("/dashboard", request));
        res.cookies.delete(OAUTH_STATE_COOKIE_NAME);

        res.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          expires: new Date(expiresAt),
          path: "/",
        });

        return res;
      }
    }

    // Scenario A: Brand new user signing up with Google
    const newUserId = `user_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const newUser = db.users.create({
      id: newUserId,
      email: userInfo.email,
      name: userInfo.name || "Google User",
      passwordHash: "",
      salt: "",
      googleId: userInfo.sub,
      avatar: userInfo.picture || null,
      authProvider: "google",
      createdAt: now,
      updatedAt: now,
    });

    // Create initial profile with Google identity details
    db.profiles.create({
      userId: newUserId,
      personal: {
        fullName: userInfo.name || "Google User",
        email: userInfo.email,
        avatarUrl: userInfo.picture || undefined,
        bio: "",
      },
      careerPreferences: {
        targetRoles: ["Software Developer"],
        preferredIndustry: "Technology",
        preferredWorkType: "hybrid",
        preferredLocation: "Flexible",
        careerInterests: [],
      },
      createdDate: now,
      lastProfileUpdate: now,
      lastAiAnalysisDate: null,
      lastResumeUpdate: null,
      lastGithubAnalysis: null,
      isAiAnalysisStale: false,
    });

    // Record creation activity
    db.activities.add(
      newUserId,
      "Account Created",
      "Created CareerPilot account with Google",
      "profile_created"
    );

    // Create session
    const { token, expiresAt } = createSession(newUser.id);

    // Redirect to profile setup with Google welcome banner
    const res = NextResponse.redirect(getBrowserUrl("/profile?welcome=google", request));
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(expiresAt),
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("[Google OAuth Callback] Error processing callback:", error);
    const res = NextResponse.redirect(getBrowserUrl("/login?error=oauth_failed", request));
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }
}
