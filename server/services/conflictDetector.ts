import type { OrderEventDoc } from "@/server/db/schema";
import { FIELD_LABELS, normalizeFieldName } from "./orderReducer";
import { getLLMProvider } from "@/server/ai";
import type { LLMProvider } from "@/server/ai/provider.interface";
import { traceAgentStage } from "../observability/tracer";

export interface ConflictOption {
  value: unknown;
  unit?: string;
  quote?: string;
  messageId?: string;
  timestamp?: Date;
  label: string;
}

export interface DetectedConflict {
  field: string;
  fieldLabel: string;
  conflictType: "contradictory_statements" | "ref_mismatch";
  explanation: string;
  optionA: ConflictOption;
  optionB: ConflictOption;
}

const SUPERSEDING_CUES = /\b(actually|change(?:d)?(?:\s+to)?|instead|rather|update(?:d)?(?:\s+to)?|make\s+that|revise(?:d)?(?:\s+to)?|correction|scratch\s+that|switch\s+to|increased?|decreased?)\b/i;

const REFERENCE_CUES = /\b(same\s+as\s+last\s+time|same\s+as\s+before|repeat\s+order|like\s+our\s+previous|as\s+usual|last\s+run)\b/i;

/**
 * Deterministic Conflict Detection Engine (Phase 6)
 *
 * Rules:
 * (a) Contradictory statements: Same field, two explicit customer values at different times
 *     without an explicit superseding / amendment cue ("actually", "change to", etc.).
 * (b) Ref-vs-Draft mismatch: A 'ref' event ("same as last time") whose resolved historical
 *     order value differs from an explicit value stated in the current draft conversation.
 *
 * Note: Deterministic rules make 100% of conflict decisions. Gemma is invoked ONLY to draft
 * a polite, concise human explanation of the conflict.
 */
export async function detectOrderConflicts(
  events: OrderEventDoc[],
  historicalOrders: Array<{ orderNumber: string; currentFields: Record<string, any> }> = [],
  customProvider?: LLMProvider
): Promise<Record<string, DetectedConflict>> {
  const conflicts: Record<string, DetectedConflict> = {};

  if (!events || events.length === 0) return conflicts;

  // Group events by normalized field
  const eventsByField = new Map<string, OrderEventDoc[]>();
  for (const ev of events) {
    const fieldKey = normalizeFieldName(ev.field);
    if (!eventsByField.has(fieldKey)) {
      eventsByField.set(fieldKey, []);
    }
    eventsByField.get(fieldKey)!.push(ev);
  }

  // 1. Check Rule (a): Contradictory Explicit Statements
  for (const [fieldKey, fieldEvents] of eventsByField.entries()) {
    // Only evaluate AI-extracted customer events (human operator overrides are definitive)
    const customerEvents = fieldEvents.filter((e) => e.actor === "ai");
    if (customerEvents.length < 2) continue;

    // Check consecutive pairs of distinct values
    for (let i = 0; i < customerEvents.length - 1; i++) {
      const prev = customerEvents[i];
      const next = customerEvents[i + 1];

      // If values are identical, no conflict
      const prevStr = String(prev.newValue).trim().toLowerCase();
      const nextStr = String(next.newValue).trim().toLowerCase();
      if (prevStr === nextStr) continue;

      // Check if later event quote has a clear amendment/superseding cue
      const nextQuote = next.source?.quote || "";
      const hasSupersedingCue = SUPERSEDING_CUES.test(nextQuote) || SUPERSEDING_CUES.test(next.note || "");

      if (!hasSupersedingCue) {
        // Direct contradiction without clarification!
        const fieldLabel = FIELD_LABELS[fieldKey] || fieldKey;
        const optA: ConflictOption = {
          value: prev.newValue,
          unit: prev.unit,
          quote: prev.source?.quote,
          messageId: prev.source?.messageId,
          timestamp: prev.timestamp instanceof Date ? prev.timestamp : new Date(prev.timestamp),
          label: "First Customer Statement",
        };
        const optB: ConflictOption = {
          value: next.newValue,
          unit: next.unit,
          quote: next.source?.quote,
          messageId: next.source?.messageId,
          timestamp: next.timestamp instanceof Date ? next.timestamp : new Date(next.timestamp),
          label: "Contradictory Customer Statement",
        };

        const defaultExplanation = `Customer stated "${prev.newValue}" ("${prev.source?.quote || ""}") and later stated "${next.newValue}" ("${next.source?.quote || ""}") without clarifying if this was a correction.`;

        conflicts[fieldKey] = {
          field: fieldKey,
          fieldLabel,
          conflictType: "contradictory_statements",
          explanation: defaultExplanation,
          optionA: optA,
          optionB: optB,
        };
        break;
      }
    }
  }

  // 2. Check Rule (b): Ref-vs-Draft Mismatch ("same as last time" vs draft specification)
  for (const [fieldKey, fieldEvents] of eventsByField.entries()) {
    if (conflicts[fieldKey]) continue; // Already conflicting from rule (a)

    // Look for a 'ref' event or quote mentioning "same as last time"
    const refEvent = fieldEvents.find(
      (e) =>
        e.status === "INFERRED" &&
        (REFERENCE_CUES.test(e.source?.quote || "") || REFERENCE_CUES.test(e.note || "") || e.source?.quote?.toLowerCase().includes("same as"))
    );

    if (!refEvent) continue;

    // Check if there is also an explicit draft value stated in the conversation
    const explicitEvent = fieldEvents.find(
      (e) => e !== refEvent && e.actor === "ai" && e.newValue && !REFERENCE_CUES.test(e.source?.quote || "")
    );

    // Find historical value from completed orders
    let historicalValue: unknown = null;
    let historicalOrderNumber = "Past Order";

    for (const hist of historicalOrders) {
      const histVal = hist.currentFields?.[fieldKey]?.value ?? hist.currentFields?.[fieldKey];
      if (histVal !== undefined && histVal !== null) {
        historicalValue = histVal;
        historicalOrderNumber = hist.orderNumber || "Past Order";
        break;
      }
    }

    if (refEvent && explicitEvent && historicalValue) {
      const histStr = String(historicalValue).trim().toLowerCase();
      const explicitStr = String(explicitEvent.newValue).trim().toLowerCase();

      // If draft explicit value differs from historical resolved value
      if (!histStr.includes(explicitStr) && !explicitStr.includes(histStr)) {
        const fieldLabel = FIELD_LABELS[fieldKey] || fieldKey;

        const optA: ConflictOption = {
          value: historicalValue,
          quote: refEvent.source?.quote || "same as last time",
          messageId: refEvent.source?.messageId,
          timestamp: refEvent.timestamp instanceof Date ? refEvent.timestamp : new Date(refEvent.timestamp),
          label: `Historical Spec (${historicalOrderNumber})`,
        };

        const optB: ConflictOption = {
          value: explicitEvent.newValue,
          unit: explicitEvent.unit,
          quote: explicitEvent.source?.quote,
          messageId: explicitEvent.source?.messageId,
          timestamp: explicitEvent.timestamp instanceof Date ? explicitEvent.timestamp : new Date(explicitEvent.timestamp),
          label: "Current Draft Specification",
        };

        const defaultExplanation = `Customer requested "${refEvent.source?.quote || "same as last time"}" (which was ${historicalValue} on ${historicalOrderNumber}), but also specified ${explicitEvent.newValue} in this conversation.`;

        conflicts[fieldKey] = {
          field: fieldKey,
          fieldLabel,
          conflictType: "ref_mismatch",
          explanation: defaultExplanation,
          optionA: optA,
          optionB: optB,
        };
      }
    }
  }

  // 3. Call Gemma to polish explanation if possible (fallback safely to deterministic text)
  if (Object.keys(conflicts).length > 0) {
    const provider = customProvider || getLLMProvider();
    for (const conflict of Object.values(conflicts)) {
      try {
        await traceAgentStage(
          "explain",
          {
            model: provider.modelName,
            metadata: {
              field: conflict.field,
              conflictType: conflict.conflictType,
            },
          },
          async () => {
            const prompt = `You are a packaging estimator assistant. Explain the following spec conflict in one concise, professional sentence for the production team:
Field: ${conflict.fieldLabel}
Option A (${conflict.optionA.label}): ${conflict.optionA.value} (Quote: "${conflict.optionA.quote || ""}")
Option B (${conflict.optionB.label}): ${conflict.optionB.value} (Quote: "${conflict.optionB.quote || ""}")
Explain the exact contradiction so an operator can resolve it.`;

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("LLM conflict explanation timeout")), 1200)
            );
            const res = await Promise.race([
              provider.generateJSON<{ explanation: string }>({
                prompt,
                system: "Output strictly JSON with an 'explanation' string property.",
              }),
              timeoutPromise,
            ]);

            if (res?.explanation && typeof res.explanation === "string" && res.explanation.length > 10) {
              conflict.explanation = res.explanation;
            }
          }
        );
      } catch {
        // Keep deterministic explanation if LLM is unavailable
      }
    }
  }

  return conflicts;
}
