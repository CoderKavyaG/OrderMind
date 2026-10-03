import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { processConversation, getConversationEvents } from "@/server/ai/extractor";
import { getConversation } from "@/server/services/inbox.service";
import { syncExtractedEventsToOrder } from "@/server/services/order.service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const result = await processConversation(workspace.id, params.id);

    // Sync extracted events into order state engine
    const conversation = await getConversation(workspace.id, params.id);
    let orderInfo = null;

    if (conversation) {
      const allEvents = await getConversationEvents(workspace.id, params.id);
      orderInfo = await syncExtractedEventsToOrder(
        workspace.id,
        params.id,
        conversation.customerId,
        allEvents
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
      order: orderInfo
        ? {
            id: orderInfo.id,
            orderNumber: orderInfo.orderNumber,
            status: orderInfo.status,
          }
        : null,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Conversation processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const events = await getConversationEvents(workspace.id, params.id);

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
