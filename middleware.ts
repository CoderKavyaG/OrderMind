import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "ordermind_token";
const JWT_SECRET = process.env.JWT_SECRET || "ordermind-super-secure-jwt-secret-min-32-chars-long-example";
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal next paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname === "/icon.svg" ||
    /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isPublicAuthRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/dev/") ||
    pathname === "/story" ||
    pathname === "/story/preview" ||
    pathname === "/how-we-built" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/signup" ||
    pathname === "/api/health";

  const isKnownProtectedRoute =
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/channels") ||
    pathname.startsWith("/memory") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/sentry-example-page");

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // If already authenticated and trying to access login/signup, redirect to workspace
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  // If not authenticated:
  if (!isAuthenticated && !isPublicAuthRoute) {
    // 1. API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Known protected pages require login
    if (isKnownProtectedRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 3. Unlisted / non-existent pages pass through so Next.js renders branded app/not-found.tsx
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
