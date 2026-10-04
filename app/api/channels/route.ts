import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { getChannelsForWorkspace } from "@/server/services/channel.service";

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const channels = await getChannelsForWorkspace(workspace.id);

    return NextResponse.json({
      success: true,
      channels,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load channels";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
