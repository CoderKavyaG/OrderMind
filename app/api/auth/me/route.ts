import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "@/server/auth/jwt";
import { getCurrentUserData } from "@/server/services/auth.service";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const data = await getCurrentUserData(payload.userId);
    if (!data) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: data.user,
      workspaces: data.workspaces,
      activeWorkspace: data.activeWorkspace,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch user state";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
