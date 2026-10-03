import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import {
  type ExtractedEvent,
  type MessageDoc,
  ExtractedEventSchema,
} from "@/server/db/schema";
import { getLLMProvider } from "./index";
import type { LLMProvider } from "./provider.interface";
import { extractFieldsStage } from "./stages/extractFields";
import { interpretReferencesStage } from "./stages/interpretReferences";
import { extractFromImageStage } from "./stages/extractFromImage";
import { getAttachmentStream } from "../services/attachment.service";
import { traceAgentStage } from "../observability/tracer";

/**
 * Checks if a quoted string is an exact verbatim substring of the source message content.
 * Normalizes minor whitespace differences (newlines vs spaces).
 */
export function verifyQuoteSubstring(quote: string, sourceText: string): boolean {
  if (!quote || !sourceText) return false;
  // If special vision quote
  if (quote.startsWith("[Image Attachment")) {
    return true;
  }
  const cleanSource = sourceText.replace(/\s+/g, " ").trim().toLowerCase();
  const cleanQuote = quote.replace(/\s+/g, " ").trim().toLowerCase();
  return cleanSource.includes(cleanQuote);
}

export interface ProcessMessageResult {
  messageId: string;
  status: "processed" | "extraction_failed";
  events: ExtractedEvent[];
  error?: string;
}

/**
 * Runs the modular 3-stage extraction pipeline on a single message.
 * Enforces Zod validation and strict quote substring verification.
 */
export async function processMessage(
  message: MessageDoc & { id: string },
  precedingMessages: Array<MessageDoc & { id: string }>,
  workspaceId: string,
  provider?: LLMProvider
): Promise<ProcessMessageResult> {
  const llm = provider || getLLMProvider();

  const messageContext = {
    id: message.id,
    senderId: message.senderId,
    senderRole: message.senderRole,
    content: message.content,
    timestamp: message.timestamp,
    attachments: message.attachments,
  };

  const precedingContext = precedingMessages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderRole: m.senderRole,
    content: m.content,
    timestamp: m.timestamp,
  }));

  const allRawEvents: ExtractedEvent[] = [];

  try {
    // Stage 1: Explicit Field Extraction (with preceding 6 messages)
    const fieldEvents = await extractFieldsStage({
      targetMessage: messageContext,
      precedingMessages: precedingContext,
      workspaceId,
      conversationId: message.conversationId,
      provider: llm,
    });
    allRawEvents.push(...fieldEvents);

    // Stage 2: Reference Interpretation (relative phrases & deltas)
    const refEvents = await interpretReferencesStage({
      targetMessage: messageContext,
      precedingMessages: precedingContext,
      workspaceId,
      conversationId: message.conversationId,
      provider: llm,
    });
    allRawEvents.push(...refEvents);

    // Stage 3: Image Vision Specs (if image attachments present)
    if (message.attachments && message.attachments.length > 0) {
      const visionResult = await extractFromImageStage({
        targetMessage: messageContext,
        workspaceId,
        conversationId: message.conversationId,
        provider: llm,
        getImageBase64: async (attachmentId: string) => {
          try {
            const streamData = await getAttachmentStream(workspaceId, attachmentId);
            if (!streamData) return null;

            const chunks: Buffer[] = [];
            for await (const chunk of streamData.stream) {
              chunks.push(Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);
            return {
              base64: buffer.toString("base64"),
              mimeType: streamData.contentType,
            };
          } catch {
            return null;
          }
        },
      });
      allRawEvents.push(...visionResult.events);
    }

    // Strict Filter & Quote Verification:
    // Reject outputs where quote is not found in the message text
    const validatedEvents = await traceAgentStage(
      "validation",
      {
        model: llm.modelName,
        metadata: {
          workspaceId,
          conversationId: message.conversationId,
          messageId: message.id,
          rawEventsCount: allRawEvents.length,
        },
      },
      async () => {
        const resultList: ExtractedEvent[] = [];
        for (const raw of allRawEvents) {
          // 1. Substring verification
          const isQuoteValid = verifyQuoteSubstring(raw.quote, message.content);
          if (!isQuoteValid) {
            console.warn(`[Gemma Guard] Rejected hallucinated quote: "${raw.quote}" not in "${message.content}"`);
            continue;
          }

          // 2. Zod validation
          try {
            const validated = ExtractedEventSchema.parse(raw);
            resultList.push(validated);
          } catch (zodErr) {
            console.warn("[Gemma Guard] Rejected invalid event schema:", zodErr);
          }
        }
        return resultList;
      }
    );

    return {
      messageId: message.id,
      status: "processed",
      events: validatedEvents,
    };
  } catch (err) {
    console.error(`[Extraction Pipeline Error] Message ${message.id} extraction failed:`, err);
    return {
      messageId: message.id,
      status: "extraction_failed",
      events: [],
      error: (err as Error).message || "Extraction failed",
    };
  }
}

export interface ProcessConversationResult {
  conversationId: string;
  totalMessages: number;
  processedCount: number;
  skippedCount: number;
  eventsCount: number;
  results: ProcessMessageResult[];
}

/**
 * Idempotently processes an entire conversation.
 * Skips messages that have already been processed into extracted_events.
 */
export async function processConversation(
  workspaceId: string,
  conversationId: string,
  provider?: LLMProvider
): Promise<ProcessConversationResult> {
  const db = await getDb();

  // Fetch all messages in chronological order
  const messages = await db
    .collection<MessageDoc>("messages")
    .find({ workspaceId, conversationId })
    .sort({ timestamp: 1 })
    .toArray();

  if (messages.length === 0) {
    return {
      conversationId,
      totalMessages: 0,
      processedCount: 0,
      skippedCount: 0,
      eventsCount: 0,
      results: [],
    };
  }

  // Find IDs of messages already processed in extracted_events
  const existingEvents = await db
    .collection("extracted_events")
    .find({ workspaceId, conversationId })
    .toArray();

  const processedMsgIds = new Set(existingEvents.map((e) => e.messageId));

  let processedCount = 0;
  let skippedCount = 0;
  let totalNewEventsCount = 0;
  const results: ProcessMessageResult[] = [];

  const formattedMessages = messages.map((m) => ({
    ...m,
    id: m._id!.toString(),
  }));

  for (let i = 0; i < formattedMessages.length; i++) {
    const msg = formattedMessages[i];

    // Idempotent: skip already-processed messages
    if (processedMsgIds.has(msg.id)) {
      skippedCount++;
      continue;
    }

    const preceding = formattedMessages.slice(Math.max(0, i - 6), i);

    const res = await processMessage(msg, preceding, workspaceId, provider);
    results.push(res);
    processedCount++;

    if (res.status === "processed" && res.events.length > 0) {
      totalNewEventsCount += res.events.length;
      await db.collection("extracted_events").insertMany(res.events);
    }

    // Update message status
    await db.collection("messages").updateOne(
      { _id: new ObjectId(msg.id), workspaceId },
      {
        $set: {
          extractionStatus: res.status,
          extractionError: res.error,
          extractedAt: new Date(),
        },
      }
    );
  }

  return {
    conversationId,
    totalMessages: formattedMessages.length,
    processedCount,
    skippedCount,
    eventsCount: totalNewEventsCount,
    results,
  };
}

/**
 * Retrieves all extracted events for a conversation, grouped by messageId.
 */
export async function getConversationEvents(
  workspaceId: string,
  conversationId: string
): Promise<Array<ExtractedEvent & { id: string }>> {
  const db = await getDb();
  const docs = await db
    .collection<ExtractedEvent>("extracted_events")
    .find({ workspaceId, conversationId })
    .sort({ createdAt: 1 })
    .toArray();

  return docs.map((d) => ({
    ...d,
    id: d._id!.toString(),
  }));
}
