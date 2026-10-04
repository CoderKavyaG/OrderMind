import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/server/auth/jwt";
import { completeOnboarding } from "@/server/services/auth.service";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }

    const body = await request.json();
    const result = await completeOnboarding(payload.userId, body);

    const response = NextResponse.json({
      success: true,
      workspace: result.workspace,
    });

    const cookieOpts = getAuthCookieOptions();
    response.cookies.set(cookieOpts.name, result.token, cookieOpts);

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to complete onboarding";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
