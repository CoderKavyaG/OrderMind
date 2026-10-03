import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { saveImportedConversation } from "@/server/services/inbox.service";
import { processConversation, getConversationEvents } from "@/server/ai/extractor";
import { syncExtractedEventsToOrder } from "@/server/services/order.service";
import type { Customer } from "@/server/db/schema";

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();

    const clientName = (body.clientName || body.customerName || "Customer").trim();
    const rawChat = (body.rawChat || body.rawText || "").trim();
    const title = (body.title || `Chat with ${clientName}`).trim();

    if (!rawChat) {
      return NextResponse.json(
        { error: "Chat transcript text is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 1. Find or create the Customer in this workspace
    let customerId = body.customerId;
    if (!customerId) {
      const existingCustomer = await db.collection<Customer>("customers").findOne({
        workspaceId: workspace.id,
        $or: [
          { name: { $regex: `^${clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
          { company: { $regex: `^${clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        ],
      });

      if (existingCustomer) {
        customerId = existingCustomer._id
          ? existingCustomer._id.toString()
          : (existingCustomer as any).id;
      } else {
        const newCustDoc = {
          workspaceId: workspace.id,
          name: clientName,
          company: clientName,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const custRes = await db.collection("customers").insertOne(newCustDoc);
        customerId = custRes.insertedId.toString();
      }
    }

    // 2. Save and normalize the conversation & messages
    const importResult = await saveImportedConversation(workspace.id, {
      customerId,
      newCustomerName: clientName,
      title,
      rawText: rawChat,
    });

    const conversationId = importResult.conversationId;

    // 3. Process conversation with Gemma extraction pipeline
    let extractedEventsCount = 0;
    let orderInfo: any = null;

    try {
      const extractionResult = await processConversation(workspace.id, conversationId);
      extractedEventsCount = extractionResult.eventsCount;

      // 4. Sync extracted events into deterministic Order State Engine
      const allEvents = await getConversationEvents(workspace.id, conversationId);
      if (allEvents.length > 0) {
        orderInfo = await syncExtractedEventsToOrder(
          workspace.id,
          conversationId,
          customerId,
          allEvents
        );
      }
    } catch (procErr) {
      console.warn("[Inbox Import] Warning: Post-import extraction fallback:", procErr);
      // Fallback: still create the order so it appears everywhere even if AI stage had a non-fatal warning
      try {
        orderInfo = await syncExtractedEventsToOrder(
          workspace.id,
          conversationId,
          customerId,
          []
        );
      } catch {}
    }

    return NextResponse.json({
      success: true,
      conversationId,
      customerId,
      clientName,
      orderId: orderInfo?.id || null,
      orderNumber: orderInfo?.orderNumber || null,
      messageCount: importResult.messageCount,
      eventsCount: extractedEventsCount,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to import chat transcript";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
