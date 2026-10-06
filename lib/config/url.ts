import type { NextRequest } from "next/server";

export const DEFAULT_LOCAL_URL = "http://localhost:3000";
export const DEFAULT_PROD_URL = "https://career-pilot-ai-theta-vert.vercel.app";
export const PROD_HOSTNAME = "career-pilot-ai-theta-vert.vercel.app";

/**
 * Sanitize an origin or URL so that 0.0.0.0 is never returned as a browser-facing host.
 * Emits http://localhost:3000 locally, or https://career-pilot-ai-theta-vert.vercel.app in production.
 */
export function sanitizeBrowserOrigin(originOrUrl?: string | null): string {
  if (!originOrUrl || typeof originOrUrl !== "string") {
    return isProductionEnv() ? DEFAULT_PROD_URL : DEFAULT_LOCAL_URL;
  }

  let str = originOrUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(str)) {
    str = (isProductionEnv() ? "https://" : "http://") + str;
  }

  try {
    const parsed = new URL(str);
    if (parsed.hostname === "0.0.0.0") {
      if (isProductionEnv()) {
        parsed.hostname = PROD_HOSTNAME;
        parsed.protocol = "https:";
        parsed.port = "";
      } else {
        parsed.hostname = "localhost";
      }
    }
    return parsed.origin;
  } catch {
    return isProductionEnv() ? DEFAULT_PROD_URL : DEFAULT_LOCAL_URL;
  }
}

/**
 * Check whether the environment is running in production.
 */
export function isProductionEnv(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "production") return true;
  return false;
}

/**
 * Returns the base browser-facing application URL.
 * Never returns 0.0.0.0.
 */
export function getBaseAppUrl(): string {
  // 1. Explicit environment variable if configured
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && envUrl.trim()) {
    return sanitizeBrowserOrigin(envUrl);
  }

  // 2. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return sanitizeBrowserOrigin(`https://${process.env.VERCEL_URL}`);
  }

  // 3. Environment default
  if (isProductionEnv()) {
    return DEFAULT_PROD_URL;
  }

  return DEFAULT_LOCAL_URL;
}

/**
 * Extract the browser-facing origin from an incoming request.
 * Resolves x-forwarded-host, host header, or request.url, sanitizing 0.0.0.0 to localhost or production host.
 */
export function getRequestOrigin(request?: Request | NextRequest | null): string {
  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const hostHeader = request.headers.get("host")?.trim();
    const host = forwardedHost || hostHeader;
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

    if (host) {
      // If host contains 0.0.0.0, replace with localhost preserving port
      const sanitizedHost = host.replace(/^0\.0\.0\.0(?::(\d+))?$/, (_, port) =>
        port ? `localhost:${port}` : "localhost:3000"
      );

      let proto = forwardedProto;
      if (!proto) {
        if (sanitizedHost.includes("vercel.app") || isProductionEnv()) {
          proto = "https";
        } else if (request.url?.startsWith("https:")) {
          proto = "https";
        } else {
          proto = "http";
        }
      }

      return sanitizeBrowserOrigin(`${proto}://${sanitizedHost}`);
    }

    if (request.url) {
      return sanitizeBrowserOrigin(request.url);
    }
  }

  return getBaseAppUrl();
}

/**
 * Constructs a fully qualified browser URL for navigation/redirects,
 * guaranteed to use a valid browser origin (never 0.0.0.0).
 */
export function getBrowserUrl(path: string, request?: Request | NextRequest | null): URL {
  if (/^https?:\/\//i.test(path)) {
    const parsed = new URL(path);
    if (parsed.hostname === "0.0.0.0") {
      if (isProductionEnv()) {
        parsed.hostname = PROD_HOSTNAME;
        parsed.protocol = "https:";
        parsed.port = "";
      } else {
        parsed.hostname = "localhost";
      }
    }
    return parsed;
  }

  const origin = getRequestOrigin(request);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, origin);
}

/**
 * Resolves the Google OAuth callback URL.
 * Local development: http://localhost:3000/api/auth/google/callback
 * Production: https://career-pilot-ai-theta-vert.vercel.app/api/auth/google/callback
 * Never emits 0.0.0.0.
 */
export function getGoogleCallbackUrl(request?: Request | NextRequest | null): string {
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim()) {
    const sanitized = process.env.GOOGLE_REDIRECT_URI.trim().replace(
      /^http:\/\/0\.0\.0\.0(?::3000)?/i,
      "http://localhost:3000"
    );
    return sanitized;
  }

  // If in production or request came to production domain
  const origin = request ? getRequestOrigin(request) : getBaseAppUrl();
  if (origin.includes("vercel.app") || isProductionEnv()) {
    return `${DEFAULT_PROD_URL}/api/auth/google/callback`;
  }

  return `${DEFAULT_LOCAL_URL}/api/auth/google/callback`;
}
