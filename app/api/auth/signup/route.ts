import { NextResponse } from "next/server";
import { signupUser, SignupInputSchema } from "@/server/services/auth.service";
import { getAuthCookieOptions } from "@/server/auth/jwt";
import { checkRateLimit } from "@/server/auth/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`signup:${clientIp}`, { maxAttempts: 10, windowMs: 15 * 60 * 1000 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = await signupUser(body);

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    const cookieOpts = getAuthCookieOptions();
    response.cookies.set(cookieOpts.name, result.token, cookieOpts);

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

