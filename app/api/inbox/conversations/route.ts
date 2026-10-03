import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { listConversations, saveImportedConversation } from "@/server/services/inbox.service";

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const conversations = await listConversations(workspace.id);

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load conversations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();

    const result = await saveImportedConversation(workspace.id, body);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to import conversation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
