import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import type {
  Conversation,
  MessageDoc,
  Customer,
  AttachmentMeta,
} from "@/server/db/schema";
import { ManualImportAdapter, type ManualImportPayload } from "./adapters/manual-import.adapter";

export interface ConversationWithCustomer extends Conversation {
  id: string;
  customer?: Customer & { id: string };
}

export async function listConversations(workspaceId: string): Promise<ConversationWithCustomer[]> {
  const db = await getDb();
  const convDocs = await db
    .collection<Conversation>("conversations")
    .find({ workspaceId })
    .sort({ lastMessageAt: -1 })
    .toArray();

  if (convDocs.length === 0) return [];

  // Fetch associated customers
  const validCustomerIds = Array.from(
    new Set(convDocs.map((c) => c.customerId).filter(Boolean))
  )
    .map((id) => {
      try {
        return new ObjectId(id);
      } catch {
        return null;
      }
    })
    .filter((id): id is ObjectId => id !== null);

  let customerDocs: Customer[] = [];
  if (validCustomerIds.length > 0) {
    customerDocs = await db
      .collection<Customer>("customers")
      .find({ _id: { $in: validCustomerIds }, workspaceId })
      .toArray();
  }

  const customerMap = new Map(
    customerDocs.map((c) => [c._id!.toString(), { ...c, id: c._id!.toString() }])
  );

  return convDocs.map((conv) => ({
    ...conv,
    id: conv._id!.toString(),
    title: conv.title || ((conv as any).customerName ? `Chat with ${(conv as any).customerName}` : "Conversation"),
    lastMessagePreview: conv.lastMessagePreview || (conv as any).lastMessage || "",
    source: conv.source || (conv as any).channel || "manual",
    messageCount: conv.messageCount || 0,
    customer: conv.customerId ? customerMap.get(conv.customerId) : undefined,
  }));
}

export async function getConversation(
  workspaceId: string,
  conversationId: string
): Promise<ConversationWithCustomer | null> {
  const db = await getDb();
  let convObjectId: ObjectId;
  try {
    convObjectId = new ObjectId(conversationId);
  } catch {
    return null;
  }

  const convDoc = await db.collection<Conversation>("conversations").findOne({
    _id: convObjectId,
    workspaceId,
  });

  if (!convDoc) return null;

  let customerDoc = null;
  try {
    customerDoc = await db.collection<Customer>("customers").findOne({
      _id: new ObjectId(convDoc.customerId),
      workspaceId,
    });
  } catch {
    // Customer not found or invalid id
  }

  return {
    ...convDoc,
    id: convDoc._id!.toString(),
    title: convDoc.title || (customerDoc?.name ? `Chat with ${customerDoc.name}` : (convDoc as any).customerName ? `Chat with ${(convDoc as any).customerName}` : "Conversation"),
    lastMessagePreview: convDoc.lastMessagePreview || (convDoc as any).lastMessage || "",
    source: convDoc.source || (convDoc as any).channel || "manual",
    messageCount: convDoc.messageCount || 0,
    customer: customerDoc ? { ...customerDoc, id: customerDoc._id!.toString() } : undefined,
  };
}

export async function getConversationMessages(
  workspaceId: string,
  conversationId: string
): Promise<Array<MessageDoc & { id: string }>> {
  const db = await getDb();
  const docs = await db
    .collection<MessageDoc>("messages")
    .find({ workspaceId, conversationId })
    .sort({ timestamp: 1 })
    .toArray();

  return docs.map((doc) => ({
    ...doc,
    id: doc._id!.toString(),
  }));
}

export interface SaveImportInput {
  customerId?: string;
  newCustomerName?: string;
  title: string;
  rawText: string;
  attachments?: Array<{
    attachment: AttachmentMeta;
    targetMessageIndex?: number;
    targetFilename?: string;
  }>;
}

export async function saveImportedConversation(
  workspaceId: string,
  input: SaveImportInput
): Promise<{ conversationId: string; messageCount: number }> {
  const db = await getDb();

  let targetCustomerId = input.customerId;

  if (!targetCustomerId) {
    if (!input.newCustomerName?.trim()) {
      throw new Error("Customer selection or new customer name is required");
    }
    const newCustomer = {
      workspaceId,
      name: input.newCustomerName.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const custResult = await db.collection("customers").insertOne(newCustomer);
    targetCustomerId = custResult.insertedId.toString();
  } else {
    // Validate customer exists and belongs to workspace
    const cust = await db.collection("customers").findOne({
      _id: new ObjectId(targetCustomerId),
      workspaceId,
    });
    if (!cust) {
      throw new Error("Customer not found or access denied");
    }
  }

  const customerDoc = await db.collection<Customer>("customers").findOne({
    _id: new ObjectId(targetCustomerId),
    workspaceId,
  });

  const conversationObjectId = new ObjectId();
  const conversationId = conversationObjectId.toString();

  // Normalize messages using ManualImportAdapter
  const adapter = new ManualImportAdapter();
  const normalizedMessages = adapter.normalize({
    conversationId,
    customerName: customerDoc?.name || "Customer",
    rawText: input.rawText,
    attachments: input.attachments,
  });

  if (normalizedMessages.length === 0) {
    throw new Error("No valid messages could be parsed from the provided text.");
  }

  const lastMsg = normalizedMessages[normalizedMessages.length - 1];

  // Insert Conversation
  const convDoc = {
    _id: conversationObjectId,
    workspaceId,
    customerId: targetCustomerId,
    title: input.title.trim() || `Chat with ${customerDoc?.name || "Customer"}`,
    source: "manual" as const,
    lastMessageAt: lastMsg.timestamp,
    lastMessagePreview: lastMsg.content.slice(0, 120),
    messageCount: normalizedMessages.length,
    status: "open" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("conversations").insertOne(convDoc);

  // Insert normalized messages
  const messageDocs = normalizedMessages.map((m) => ({
    workspaceId,
    conversationId,
    source: m.source,
    senderId: m.senderId,
    senderRole: m.senderRole,
    timestamp: m.timestamp,
    type: m.type,
    content: m.content,
    attachments: m.attachments,
    createdAt: new Date(),
  }));

  await db.collection("messages").insertMany(messageDocs);

  // Link any uploaded attachments to this conversationId so they appear everywhere
  if (input.attachments && input.attachments.length > 0) {
    const attObjectIds = input.attachments
      .map((a) => a.attachment?.id)
      .filter(Boolean)
      .map((id) => {
        try { return new ObjectId(id); } catch { return null; }
      })
      .filter((id): id is ObjectId => id !== null);

    if (attObjectIds.length > 0) {
      await db.collection("attachments").updateMany(
        { _id: { $in: attObjectIds }, workspaceId },
        { $set: { conversationId } }
      );
    }
  }

  return {
    conversationId,
    messageCount: normalizedMessages.length,
  };
}

export interface AddMessageInput {
  senderId?: string;
  senderRole?: "customer" | "business";
  content: string;
  type?: "text" | "image" | "voice" | "pdf";
  attachments?: AttachmentMeta[];
}

export async function addMessageToConversation(
  workspaceId: string,
  conversationId: string,
  input: AddMessageInput
): Promise<MessageDoc & { id: string }> {
  const db = await getDb();
  
  let convObjectId: ObjectId;
  try {
    convObjectId = new ObjectId(conversationId);
  } catch {
    throw new Error("Invalid conversation ID");
  }

  const conv = await db.collection<Conversation>("conversations").findOne({
    _id: convObjectId,
    workspaceId,
  });

  if (!conv) {
    throw new Error("Conversation not found");
  }

  const now = new Date();
  const senderRole = input.senderRole || "customer";
  let senderId = input.senderId;

  if (!senderId) {
    if (senderRole === "customer") {
      // Find customer name
      const cust = await db.collection<Customer>("customers").findOne({
        _id: new ObjectId(conv.customerId),
        workspaceId,
      });
      senderId = cust?.name || "Customer";
    } else {
      senderId = "Operator";
    }
  }

  const messageDoc: MessageDoc = {
    workspaceId,
    conversationId,
    source: conv.source || "manual",
    senderId,
    senderRole,
    timestamp: now,
    type: input.type || (input.attachments && input.attachments.length > 0 ? (input.attachments[0].contentType?.startsWith("image/") ? "image" : input.attachments[0].contentType?.startsWith("audio/") ? "voice" : "pdf") : "text"),
    content: input.content,
    attachments: input.attachments || [],
    createdAt: now,
  };

  const insertResult = await db.collection("messages").insertOne(messageDoc);

  // Link any attachments on this message to conversationId
  if (input.attachments && input.attachments.length > 0) {
    const attObjectIds = input.attachments
      .map((a) => a.id)
      .filter(Boolean)
      .map((id) => {
        try { return new ObjectId(id); } catch { return null; }
      })
      .filter((id): id is ObjectId => id !== null);

    if (attObjectIds.length > 0) {
      await db.collection("attachments").updateMany(
        { _id: { $in: attObjectIds }, workspaceId },
        { $set: { conversationId } }
      );
    }
  }

  // Update conversation record
  await db.collection("conversations").updateOne(
    { _id: convObjectId, workspaceId },
    {
      $set: {
        lastMessageAt: now,
        lastMessagePreview: input.content.slice(0, 120),
        updatedAt: now,
      },
      $inc: { messageCount: 1 },
    }
  );

  return {
    ...messageDoc,
    id: insertResult.insertedId.toString(),
  };
}

