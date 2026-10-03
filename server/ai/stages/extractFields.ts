import type { LLMProvider } from "../provider.interface";
import type { ExtractedEvent } from "@/server/db/schema";
import { PACKAGING_FIELDS } from "@/server/db/schema";
import { traceAgentStage } from "@/server/observability/tracer";

export interface MessageContext {
  id: string;
  senderId: string;
  senderRole: "customer" | "business";
  content: string;
  timestamp?: Date;
}

export interface ExtractFieldsInput {
  targetMessage: MessageContext;
  precedingMessages?: MessageContext[]; // Up to 6 messages preceding the target
  workspaceId: string;
  conversationId: string;
  provider: LLMProvider;
}

interface RawFieldOutput {
  events: Array<{
    field: string;
    value: string | number;
    unit?: string;
    quote: string;
    confidence: number;
  }>;
}

export async function extractFieldsStage(
  input: ExtractFieldsInput
): Promise<ExtractedEvent[]> {
  const { targetMessage, precedingMessages = [], workspaceId, conversationId, provider } = input;

  // If message has no text content (e.g. pure file or empty), return empty
  if (!targetMessage.content || !targetMessage.content.trim()) {
    return [];
  }

  // Preceding messages context (up to 6)
  const contextSnippet = precedingMessages
    .slice(-6)
    .map((m, idx) => `[Context #${idx + 1}] ${m.senderId} (${m.senderRole}): ${m.content}`)
    .join("\n");

  const prompt = `You are an AI extracting packaging manufacturing specifications from customer chats.

PRECEDING CONVERSATION CONTEXT (last ${precedingMessages.length} messages):
${contextSnippet || "(No previous messages)"}

TARGET MESSAGE TO ANALYZE:
Sender: ${targetMessage.senderId} (${targetMessage.senderRole})
Content: "${targetMessage.content}"

PACKAGING SPECIFICATION FIELDS TO EXTRACT:
${PACKAGING_FIELDS.join(", ")}

RULES:
1. Extract only EXPLICIT field declarations made in the TARGET MESSAGE.
2. For each extracted field, output:
   - "field": field name from the allowed list
   - "value": the extracted value (e.g. 500, "rigid top-and-bottom box", "metallic gold foil")
   - "unit": optional measurement unit (e.g. "units", "cm", "mm", "GSM")
   - "quote": MUST be an exact verbatim substring from the TARGET MESSAGE content proving this claim
   - "confidence": confidence score between 0.0 and 1.0
3. If no fields are declared in the target message, return {"events": []}.
4. Never invent or hallucinate data. If a field is not stated, do not extract it.

Output strictly valid JSON matching this schema:
{"events": [{"field": "...", "value": "...", "unit": "...", "quote": "...", "confidence": 0.95}]}`;

  return traceAgentStage(
    "extract",
    {
      model: provider.modelName,
      metadata: {
        workspaceId,
        conversationId,
        messageId: targetMessage.id,
      },
    },
    async () => {
      const res = await provider.generateJSON<RawFieldOutput>({
        system: "You are a packaging domain specification extractor. Output strictly valid JSON without explanation.",
        prompt,
      });

      if (!res || !Array.isArray(res.events)) {
        return [];
      }

      return res.events.map((e) => ({
        workspaceId,
        conversationId,
        messageId: targetMessage.id,
        field: e.field,
        value: e.value,
        unit: e.unit,
        op: "set" as const,
        quote: e.quote,
        confidence: Math.max(0, Math.min(1, typeof e.confidence === "number" ? e.confidence : 0.9)),
        stage: "field_extraction" as const,
        createdAt: new Date(),
      }));
    }
  );
}
