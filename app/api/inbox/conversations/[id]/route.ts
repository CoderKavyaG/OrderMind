import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { getConversation, getConversationMessages } from "@/server/services/inbox.service";
import { getConversationEvents } from "@/server/ai/extractor";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const conversation = await getConversation(workspace.id, params.id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const [messages, events] = await Promise.all([
      getConversationMessages(workspace.id, params.id),
      getConversationEvents(workspace.id, params.id),
    ]);

    return NextResponse.json({
      success: true,
      conversation,
      messages,
      events,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load conversation details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
