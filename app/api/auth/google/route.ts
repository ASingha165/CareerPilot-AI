import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleOAuthConfig,
  generateOAuthState,
  getGoogleAuthUrl,
  OAUTH_STATE_COOKIE_NAME,
} from "@/lib/auth/google";
import { getCurrentUser } from "@/lib/auth/session";
import { getBrowserUrl } from "@/lib/config/url";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = (searchParams.get("mode") === "connect" ? "connect" : "signin") as "signin" | "connect";
    const prompt = searchParams.get("prompt") || "select_account";

    let currentUserId: string | null = null;
    if (mode === "connect") {
      const auth = await getCurrentUser(request);
      if (!auth) {
        return NextResponse.redirect(getBrowserUrl("/login?error=auth_required", request));
      }
      currentUserId = auth.user.id;
    }

    const config = getGoogleOAuthConfig(request);
    if (!config.isConfigured) {
      console.warn("[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in environment variables.");
      const redirectPath = mode === "connect" ? "/profile?tab=security&error=google_not_configured" : "/login?error=google_not_configured";
      return NextResponse.redirect(getBrowserUrl(redirectPath, request));
    }

    // Generate cryptographic state & nonce
    const { stateParam, nonce } = generateOAuthState(mode, currentUserId);
    const authUrl = getGoogleAuthUrl(stateParam, prompt, request);

    const response = NextResponse.redirect(authUrl);

    // Set state nonce cookie (expires in 10 minutes)
    response.cookies.set({
      name: OAUTH_STATE_COOKIE_NAME,
      value: nonce,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[API /api/auth/google] Error starting OAuth flow:", error);
    return NextResponse.redirect(getBrowserUrl("/login?error=oauth_init_failed", request));
  }
}
