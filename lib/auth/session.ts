import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { User, UserProfileEntity } from "@/lib/db/types";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";

export { SESSION_COOKIE_NAME };
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  db.sessions.create(userId, token, expiresAt);
  return { token, expiresAt };
}

export function getTokenFromRequest(request?: Request | NextRequest): string | null {
  if (request) {
    // Check Authorization header: Bearer <token>
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7).trim();
    }
    // Check Cookie header if present
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match) return match[1];
    }
  }

  // Fallback to Next.js cookies() helper
  try {
    const cookieStore = cookies();
    const c = cookieStore.get(SESSION_COOKIE_NAME);
    if (c?.value) return c.value;
  } catch {
    // cookies() might fail in contexts outside RequestHandler
  }

  return null;
}

export async function getCurrentUser(
  request?: Request | NextRequest
): Promise<{ user: User; profile: UserProfileEntity } | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const session = db.sessions.findByToken(token);
  if (!session) return null;

  const user = db.users.findById(session.userId);
  if (!user) return null;

  let profile = db.profiles.findByUserId(user.id);
  if (!profile) {
    profile = db.profiles.create({
      userId: user.id,
      personal: {
        fullName: user.name,
        email: user.email,
        avatarUrl: user.avatar || undefined,
      },
      careerPreferences: {
        targetRoles: ["Software Developer"],
        preferredIndustry: "Technology",
        preferredWorkType: "hybrid",
        preferredLocation: "Flexible",
        careerInterests: [],
      },
      createdDate: user.createdAt,
      lastProfileUpdate: user.createdAt,
      lastAiAnalysisDate: null,
      lastResumeUpdate: null,
      lastGithubAnalysis: null,
      isAiAnalysisStale: false,
    });
  }

  return { user, profile };
}
