import type { OrderEventDoc } from "@/server/db/schema";
import { FIELD_LABELS, normalizeFieldName } from "./orderReducer";

export interface OrderChangeItem {
  id: string;
  field: string;
  fieldLabel: string;
  from: unknown;
  to: unknown;
  unit?: string;
  when: Date;
  actor: "ai" | "human";
  status: string;
  evidenceQuote?: string;
  note?: string;
  explanation: string;
}

/**
 * Pure function:
 * Examines order_events and generates structured, plain-English change records
 * suitable for the "What Changed" panel and audit diffs.
 */
export function detectOrderChanges(events: OrderEventDoc[]): OrderChangeItem[] {
  if (!events || events.length === 0) return [];

  // Sort events chronologically (earliest to latest)
  const sorted = [...events].sort((a, b) => {
    const tA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const tB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return tA - tB;
  });

  const changes: OrderChangeItem[] = [];
  const lastValuePerField = new Map<string, unknown>();

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const fieldKey = normalizeFieldName(ev.field);
    const label = FIELD_LABELS[fieldKey] || fieldKey;

    let fromVal: unknown = ev.previousValue !== undefined ? ev.previousValue : null;
    if (fromVal === null && lastValuePerField.has(fieldKey)) {
      fromVal = lastValuePerField.get(fieldKey);
    }
    const toVal = ev.newValue;
    lastValuePerField.set(fieldKey, toVal);

    // Generate plain-English explanation
    let explanation = "";
    if (ev.actor === "human") {
      if (fromVal !== null && fromVal !== undefined) {
        explanation = `${label} was updated from "${fromVal}" to "${toVal}" by human operator.`;
      } else {
        explanation = `${label} was verified and set to "${toVal}" by human operator.`;
      }
      if (ev.note) {
        explanation += ` (${ev.note})`;
      }
    } else {
      // AI actor
      if (fromVal !== null && fromVal !== undefined && fromVal !== toVal) {
        explanation = `${label} changed from "${fromVal}" to "${toVal}"`;
        if (ev.source?.quote) {
          explanation += ` based on customer statement: "${ev.source.quote}".`;
        } else {
          explanation += ".";
        }
      } else {
        explanation = `${label} initially specified as "${toVal}"`;
        if (ev.source?.quote) {
          explanation += ` based on customer statement: "${ev.source.quote}".`;
        } else {
          explanation += ".";
        }
      }
      if (ev.status === "INFERRED") {
        explanation += " [Requires human operator review]";
      }
    }

    changes.push({
      id: ev._id ? ev._id.toString() : `change-${i}`,
      field: fieldKey,
      fieldLabel: label,
      from: fromVal,
      to: toVal,
      unit: ev.unit,
      when: ev.timestamp instanceof Date ? ev.timestamp : new Date(ev.timestamp),
      actor: ev.actor,
      status: ev.status,
      evidenceQuote: ev.source?.quote,
      note: ev.note,
      explanation,
    });
  }

  // Return newest changes first for display
  return changes.reverse();
}
