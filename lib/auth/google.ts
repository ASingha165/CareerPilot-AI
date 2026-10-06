import crypto from "crypto";
import { OAUTH_STATE_COOKIE_NAME, LINK_TOKEN_COOKIE_NAME } from "@/lib/constants/auth";

import { getGoogleCallbackUrl } from "@/lib/config/url";
import type { NextRequest } from "next/server";

export { OAUTH_STATE_COOKIE_NAME, LINK_TOKEN_COOKIE_NAME };

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isConfigured: boolean;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

export interface OAuthStatePayload {
  nonce: string;
  mode: "signin" | "connect";
  userId?: string | null;
  timestamp: number;
}

export interface PendingLinkPayload {
  userId: string;
  googleId: string;
  googleEmail: string;
  name: string;
  avatar?: string | null;
  expiresAt: number;
}

const STATE_SECRET =
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.SESSION_SECRET ||
  "careerpilot-secure-oauth-state-secret-salt";

export function getGoogleOAuthConfig(request?: Request | NextRequest | null): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = getGoogleCallbackUrl(request);

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

/**
 * Generate a cryptographically signed OAuth state parameter and return
 * the state string along with the raw nonce to be set in an HTTP-only cookie.
 */
export function generateOAuthState(
  mode: "signin" | "connect" = "signin",
  userId?: string | null
): { stateParam: string; nonce: string } {
  const nonce = crypto.randomBytes(24).toString("hex");
  const payload: OAuthStatePayload = {
    nonce,
    mode,
    userId: userId || null,
    timestamp: Date.now(),
  };

  const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(serialized)
    .digest("base64url");

  const stateParam = `${serialized}.${hmac}`;
  return { stateParam, nonce };
}

/**
 * Validate the state parameter returned from Google against the HMAC signature
 * and against the nonce stored in the secure HTTP-only cookie.
 */
export function verifyOAuthState(
  stateParam: string | null | undefined,
  cookieNonce: string | null | undefined
): { valid: boolean; payload?: OAuthStatePayload; error?: string } {
  if (!stateParam || !cookieNonce) {
    return { valid: false, error: "Missing state parameter or state cookie" };
  }

  const parts = stateParam.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Malformed state parameter" };
  }

  const [serialized, receivedHmac] = parts;
  const expectedHmac = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(serialized)
    .digest("base64url");

  // Constant-time comparison
  const hmacBufferA = Buffer.from(receivedHmac);
  const hmacBufferB = Buffer.from(expectedHmac);
  if (
    hmacBufferA.length !== hmacBufferB.length ||
    !crypto.timingSafeEqual(hmacBufferA, hmacBufferB)
  ) {
    return { valid: false, error: "State HMAC signature mismatch" };
  }

  try {
    const payload: OAuthStatePayload = JSON.parse(
      Buffer.from(serialized, "base64url").toString("utf-8")
    );

    // Verify nonce matches cookie
    if (payload.nonce !== cookieNonce) {
      return { valid: false, error: "State nonce does not match cookie" };
    }

    // Verify timestamp within 10 minutes
    const MAX_AGE_MS = 10 * 60 * 1000;
    if (Date.now() - payload.timestamp > MAX_AGE_MS) {
      return { valid: false, error: "OAuth state expired" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to deserialize state payload" };
  }
}

/**
 * Build the Google authorization consent URL
 */
export function getGoogleAuthUrl(
  stateParam: string,
  prompt = "select_account",
  request?: Request | NextRequest | null
): string {
  const config = getGoogleOAuthConfig(request);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("state", stateParam);
  url.searchParams.set("prompt", prompt);

  return url.toString();
}

/**
 * Secure server-side authorization code exchange for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  request?: Request | NextRequest | null
): Promise<{ accessToken: string; idToken: string }> {
  const config = getGoogleOAuthConfig(request);

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Google OAuth credentials are not configured on the server");
  }

  const bodyParams = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[Google OAuth] Token exchange error:", response.status, errText);
    throw new Error("Failed to exchange authorization code for Google access token");
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("No access_token returned by Google");
  }

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
  };
}

/**
 * Fetch and validate user profile information from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user information from Google");
  }

  const data = await response.json();

  if (!data.sub) {
    throw new Error("Invalid Google user: missing subject identifier (sub)");
  }

  if (!data.email) {
    throw new Error("Google account did not provide an email address");
  }

  return {
    sub: String(data.sub),
    email: String(data.email).toLowerCase().trim(),
    emailVerified: Boolean(data.email_verified),
    name: String(data.name || data.given_name || "Google User").trim(),
    picture: data.picture ? String(data.picture) : undefined,
  };
}

/**
 * Create a signed, short-lived token for existing account linking verification
 */
export function createPendingLinkToken(
  data: Omit<PendingLinkPayload, "expiresAt">
): string {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  const payload: PendingLinkPayload = { ...data, expiresAt };

  const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(serialized)
    .digest("base64url");

  return `${serialized}.${hmac}`;
}

/**
 * Verify a pending account linking token
 */
export function verifyPendingLinkToken(
  tokenStr: string | null | undefined
): PendingLinkPayload | null {
  if (!tokenStr) return null;
  const parts = tokenStr.split(".");
  if (parts.length !== 2) return null;

  const [serialized, receivedHmac] = parts;
  const expectedHmac = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(serialized)
    .digest("base64url");

  const a = Buffer.from(receivedHmac);
  const b = Buffer.from(expectedHmac);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload: PendingLinkPayload = JSON.parse(
      Buffer.from(serialized, "base64url").toString("utf-8")
    );

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
