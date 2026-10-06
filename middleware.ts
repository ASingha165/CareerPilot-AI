import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";
import { getBrowserUrl } from "@/lib/config/url";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/resume",
  "/career",
  "/roadmap",
  "/interview",
  "/interview-intelligence",
  "/github",
  "/skillsbuild",
  "/onboarding",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Intercept any browser request that reached the server with a 0.0.0.0 host header
  const host = request.headers.get("host") || "";
  if (host.startsWith("0.0.0.0")) {
    const cleanUrl = getBrowserUrl(`${pathname}${request.nextUrl.search}`, request);
    return NextResponse.redirect(cleanUrl);
  }

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If trying to access a protected route without a session cookie, redirect to /login
  if (isProtectedRoute) {
    if (!sessionCookie) {
      const loginUrl = getBrowserUrl("/login", request);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in, redirect away from /login and /signup (unless account linking is in progress)
  if (pathname === "/login" || pathname === "/signup") {
    const isLinking = request.nextUrl.searchParams.get("link") === "required";
    if (sessionCookie && !isLinking) {
      return NextResponse.redirect(getBrowserUrl("/dashboard", request));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/resume/:path*",
    "/career/:path*",
    "/roadmap/:path*",
    "/interview/:path*",
    "/interview-intelligence/:path*",
    "/github/:path*",
    "/skillsbuild/:path*",
    "/onboarding/:path*",
    "/login",
    "/signup",
  ],
};
