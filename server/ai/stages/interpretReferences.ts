import type { LLMProvider } from "../provider.interface";
import type { ExtractedEvent } from "@/server/db/schema";
import { traceAgentStage } from "@/server/observability/tracer";
import type { MessageContext } from "./extractFields";

export interface InterpretReferencesInput {
  targetMessage: MessageContext;
  precedingMessages?: MessageContext[];
  workspaceId: string;
  conversationId: string;
  provider: LLMProvider;
}

interface RawReferenceOutput {
  events: Array<{
    field: string;
    value: string | number;
    unit?: string;
    op: "delta" | "ref";
    rawPhrase: string;
    quote: string;
    confidence: number;
  }>;
}

export async function interpretReferencesStage(
  input: InterpretReferencesInput
): Promise<ExtractedEvent[]> {
  const { targetMessage, precedingMessages = [], workspaceId, conversationId, provider } = input;

  if (!targetMessage.content || !targetMessage.content.trim()) {
    return [];
  }

  // Pre-filter: if text doesn't contain reference or relative keywords, we can still run or short-circuit if needed
  const contextSnippet = precedingMessages
    .slice(-6)
    .map((m, idx) => `[Context #${idx + 1}] ${m.senderId} (${m.senderRole}): ${m.content}`)
    .join("\n");

  const prompt = `You are an expert packaging order reference analyzer.
Your job is to identify relative phrases (deltas) and historical references (refs).

PRECEDING CONVERSATION CONTEXT (last ${precedingMessages.length} messages):
${contextSnippet || "(No previous messages)"}

TARGET MESSAGE TO ANALYZE:
"${targetMessage.content}"

WE ARE LOOKING FOR TWO CATEGORIES:
1. "delta" (Relative changes):
   - Phrases modifying a parameter relative to a base (e.g., "make it a little taller", "add 2.5 cm in height", "+200 extra units", "widen by 10mm").
   - Output op: "delta". Keep the raw phrase in "rawPhrase".
2. "ref" (Historical / external references):
   - Phrases referring to past orders or established standards (e.g., "same as last time", "usual navy kraft", "previous die-line", "repeat order specs").
   - Output op: "ref". Keep the raw phrase in "rawPhrase".

CRITICAL RULE:
"quote" MUST be an exact verbatim substring from the TARGET MESSAGE content. If not present in the target message, DO NOT extract it.

Output strictly valid JSON matching this schema:
{"events": [{"field": "height", "value": "+2.5 cm", "unit": "cm", "op": "delta", "rawPhrase": "...", "quote": "...", "confidence": 0.9}]}`;

  return traceAgentStage(
    "interpret",
    {
      model: provider.modelName,
      metadata: {
        workspaceId,
        conversationId,
        messageId: targetMessage.id,
      },
    },
    async () => {
      const res = await provider.generateJSON<RawReferenceOutput>({
        system: "You identify relative deltas and historical references in packaging requests. Output strictly valid JSON.",
        prompt,
      });

      if (!res || !Array.isArray(res.events)) {
        return [];
      }

      return res.events
        .filter((e) => e.op === "delta" || e.op === "ref")
        .map((e) => ({
          workspaceId,
          conversationId,
          messageId: targetMessage.id,
          field: e.field,
          value: e.value,
          unit: e.unit,
          op: e.op,
          rawPhrase: e.rawPhrase || e.quote,
          quote: e.quote,
          confidence: Math.max(0, Math.min(1, typeof e.confidence === "number" ? e.confidence : 0.9)),
          stage: "reference_interpretation" as const,
          createdAt: new Date(),
        }));
    }
  );
}
