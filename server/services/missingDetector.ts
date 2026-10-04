import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import type { ClarificationDoc } from "@/server/db/schema";
import { FIELD_LABELS } from "./orderReducer";
import { getLLMProvider } from "@/server/ai";
import type { LLMProvider } from "@/server/ai/provider.interface";
import { traceAgentStage } from "../observability/tracer";
import { processMessage, getConversationEvents } from "@/server/ai/extractor";
import { syncExtractedEventsToOrder, getOrderDetails, type OrderWithDetails } from "./order.service";

const DEFAULT_QUESTION_TEMPLATES: Record<string, (name: string) => string> = {
  product_type: (name) =>
    `Hi ${name}, could you confirm what box structure or packaging style you need (e.g. rigid box, mailer box, or folding carton)?`,
  quantity: (name) =>
    `Hi ${name}, how many units would you like us to quote and produce for this order?`,
  dimensions: (name) =>
    `Hi ${name}, what are the required box dimensions (Length x Width x Height in mm or inches)?`,
  material: (name) =>
    `Hi ${name}, what paper or board material (and GSM caliper) would you prefer for these boxes?`,
  finish: (name) =>
    `Hi ${name}, what surface finish would you like (e.g. matte lamination, gloss finish, or gold foil stamping)?`,
  printing: (name) =>
    `Hi ${name}, do you require full outer CMYK printing, Pantone spot colors, or inner printing as well?`,
  deadline: (name) =>
    `Hi ${name}, what is your target delivery date or critical deadline for receiving this order?`,
};

/**
 * Generates polite clarification questions for missing packaging specifications.
 * Uses Gemma if available, falling back safely to deterministic packaging templates.
 */
export async function draftClarificationQuestion(
  field: string,
  customerName: string,
  provider?: LLMProvider
): Promise<string> {
  const fallback =
    DEFAULT_QUESTION_TEMPLATES[field]?.(customerName) ||
    `Hi ${customerName}, could you please clarify your specification for ${FIELD_LABELS[field] || field}?`;

  const llm = provider || getLLMProvider();

  return traceAgentStage(
    "explain",
    {
      model: llm.modelName,
      metadata: { field, customerName },
    },
    async () => {
      try {
        const prompt = `Draft a polite, professional 1-sentence WhatsApp clarification question asking packaging client "${customerName}" for their missing "${FIELD_LABELS[field] || field}".
Requirements:
- 1 sentence only
- Warm, polite tone suitable for a packaging business estimator
- Output strictly JSON: { "question": "..." }`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("LLM draft timeout")), 1200)
        );
        const res = await Promise.race([
          llm.generateJSON<{ question: string }>({
            prompt,
            system: "Output strictly JSON with a 'question' string property.",
          }),
          timeoutPromise,
        ]);

        if (res?.question && typeof res.question === "string" && res.question.trim().length > 10) {
          return res.question.trim();
        }
      } catch {
        // Graceful fallback to deterministic template
      }

      return fallback;
    }
  );
}

/**
 * Detects missing required packaging fields and creates clarification records.
 */
export async function detectAndCreateClarifications(
  workspaceId: string,
  orderId: string,
  customerName: string,
  missingFields: string[],
  customProvider?: LLMProvider
): Promise<Array<ClarificationDoc & { id: string }>> {
  const db = await getDb();

  // Find existing open clarifications for this order
  const existingClarifications = await db
    .collection<ClarificationDoc>("clarifications")
    .find({ workspaceId, orderId })
    .toArray();

  const existingFieldMap = new Map(
    existingClarifications.map((c) => [c.field, c])
  );

  for (const field of missingFields) {
    const existing = existingFieldMap.get(field);
    if (existing && (existing.status === "open" || existing.status === "answered")) {
      continue; // Clarification already tracked
    }

    const questionText = await draftClarificationQuestion(field, customerName, customProvider);
    const label = FIELD_LABELS[field] || field;

    const newDoc: ClarificationDoc = {
      workspaceId,
      orderId,
      field,
      fieldLabel: label,
      question: questionText,
      status: "open",
      createdAt: new Date(),
    };

    await db.collection("clarifications").insertOne(newDoc);
  }

  return listOrderClarifications(workspaceId, orderId);
}

/**
 * Lists all clarifications for an order.
 */
export async function listOrderClarifications(
  workspaceId: string,
  orderId: string
): Promise<Array<ClarificationDoc & { id: string }>> {
  const db = await getDb();
  const docs = await db
    .collection<ClarificationDoc>("clarifications")
    .find({ workspaceId, orderId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => ({
    ...doc,
    id: doc._id!.toString(),
  }));
}

/**
 * "Answer Received" flow:
 * Ingests customer reply as a new message, re-runs extraction pipeline,
 * syncs claims to order state engine, and auto-closes the clarification if resolved.
 */
export async function handleAnswerReceived(
  workspaceId: string,
  orderId: string,
  clarificationId: string,
  customerReplyText: string,
  actorEmail?: string
): Promise<{ order: OrderWithDetails; clarification: ClarificationDoc & { id: string } }> {
  const db = await getDb();

  let clarObjectId: ObjectId;
  try {
    clarObjectId = new ObjectId(clarificationId);
  } catch {
    throw new Error("Invalid clarification ID");
  }

  const clarification = await db.collection<ClarificationDoc>("clarifications").findOne({
    _id: clarObjectId,
    workspaceId,
  });

  if (!clarification) {
    throw new Error("Clarification record not found");
  }

  const resolvedOrderId = clarification.orderId || orderId;
  const orderDetails = await getOrderDetails(workspaceId, resolvedOrderId);
  if (!orderDetails) {
    throw new Error("Order not found");
  }

  // 1. Create a new message in the conversation representing customer's answer
  const newMessageDoc = {
    workspaceId,
    conversationId: orderDetails.conversationId,
    senderId: orderDetails.customerId,
    senderRole: "customer" as const,
    timestamp: new Date(),
    type: "text" as const,
    content: customerReplyText.trim(),
    attachments: [],
    createdAt: new Date(),
    metadata: {
      source: "clarification_reply",
      answeredClarificationId: clarificationId,
      field: clarification.field,
    },
  };

  const msgRes = await db.collection("messages").insertOne(newMessageDoc);
  const createdMessage = {
    ...newMessageDoc,
    id: msgRes.insertedId.toString(),
  };

  // 2. Deterministic guaranteed event for the exact answered clarification field
  const directEvent = {
    field: clarification.field,
    value: customerReplyText.trim(),
    op: "set" as const,
    messageId: createdMessage.id,
    quote: customerReplyText.trim(),
    confidence: 1.0,
    createdAt: new Date(),
  };

  await db.collection("extracted_events").insertOne({
    ...directEvent,
    workspaceId,
    conversationId: orderDetails.conversationId,
    createdAt: new Date(),
  });

  // 3. Mark clarification as answered
  await db.collection("clarifications").updateOne(
    { _id: clarObjectId, workspaceId },
    {
      $set: {
        status: "answered",
        customerReply: customerReplyText.trim(),
        answeredAt: new Date(),
      },
    }
  );

  // 4. Fetch all conversation events and sync to order
  const allEvents = await getConversationEvents(workspaceId, orderDetails.conversationId);
  await syncExtractedEventsToOrder(
    workspaceId,
    orderDetails.conversationId,
    orderDetails.customerId,
    allEvents
  );

  // 5. Re-fetch order to return updated clarification list and reduced fields
  const finalOrder = await getOrderDetails(workspaceId, resolvedOrderId);

  const updatedClarification = await db
    .collection<ClarificationDoc>("clarifications")
    .findOne({ _id: clarObjectId, workspaceId });

  return {
    order: finalOrder || (orderDetails as OrderWithDetails),
    clarification: {
      ...updatedClarification!,
      id: updatedClarification!._id!.toString(),
    },
  };
}
