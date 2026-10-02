import { NextResponse } from "next/server";
import { loginUser } from "@/server/services/auth.service";
import { getAuthCookieOptions } from "@/server/auth/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const result = await loginUser(body, clientIp);

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    const cookieOpts = getAuthCookieOptions();
    response.cookies.set(cookieOpts.name, result.token, cookieOpts);

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log in";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
