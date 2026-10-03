import {
  type OrderEventDoc,
  type FieldStatus,
  type OrderStatus,
  type OrderType,
  REQUIRED_FIELDS_BY_ORDER_TYPE,
} from "@/server/db/schema";

export const REQUIRED_PACKAGING_FIELDS = [
  "product_type",
  "quantity",
  "dimensions",
  "material",
  "finish",
  "printing",
  "deadline",
] as const;

export const FIELD_LABELS: Record<string, string> = {
  product_type: "Product Structure / Type",
  quantity: "Production Quantity",
  dimensions: "Box Dimensions (L x W x H)",
  height: "Box Height",
  length: "Box Length",
  width: "Box Width",
  material: "Board / Paper Material",
  gsm: "Paper GSM / Caliper",
  finish: "Surface Finish & Foiling",
  printing: "Printing Specs & Colors",
  logo_placement: "Logo Stamping & Placement",
  accessories: "Inserts, Trays & Accessories",
  deadline: "Delivery Deadline",
  special_instructions: "Special Production Notes",
  // Consultation fields
  consultation_tier: "Consultation Tier",
  duration: "Session Duration",
  scheduled_date: "Scheduled Date & Time",
  // Design fields
  design_tier: "Design Tier",
  sku_name: "SKU Name / Reference",
  concepts_count: "Number of Concepts",
};

export interface EvidenceRecord {
  messageId?: string;
  quote?: string;
  actor: "ai" | "human";
  timestamp: Date;
  note?: string;
}

export interface FieldHistoryItem {
  value: unknown;
  unit?: string;
  status: FieldStatus;
  actor: "ai" | "human";
  timestamp: Date;
  note?: string;
}

export interface ComputedField {
  field: string;
  label: string;
  value: unknown;
  unit?: string;
  status: FieldStatus;
  evidence: EvidenceRecord[];
  history: FieldHistoryItem[];
  conflict?: any;
  isRequired: boolean;
}

export interface ReducedOrderState {
  fields: Record<string, ComputedField>;
  overallStatus: OrderStatus;
  allRequiredPresent: boolean;
  missingFields: string[];
  inferredCount: number;
  confirmedCount: number;
  conflictingCount: number;
}

/**
 * Normalizes field keys to snake_case (e.g. productType -> product_type).
 */
export function normalizeFieldName(field: string): string {
  const mapping: Record<string, string> = {
    productType: "product_type",
    logoPlacement: "logo_placement",
    specialInstructions: "special_instructions",
    consultationTier: "consultation_tier",
    scheduledDate: "scheduled_date",
    designTier: "design_tier",
    skuName: "sku_name",
    conceptsCount: "concepts_count",
  };
  return mapping[field] || field;
}

/**
 * Pure deterministic reducer:
 * Replays order events into current field states and audit evidence.
 *
 * Rules:
 * 1. Explicit customer statement = CONFIRMED candidate.
 * 2. Deltas/refs = INFERRED until human confirms.
 * 3. Required fields absent = MISSING.
 * 4. Later events supersede earlier ones but preserve full history.
 * 5. Human actions (confirm / edit) override AI status.
 */
export function replayOrderEvents(
  events: OrderEventDoc[],
  conflicts?: Record<string, any>,
  orderType: OrderType = "manufacturing"
): ReducedOrderState {
  const typeReq = REQUIRED_FIELDS_BY_ORDER_TYPE[orderType] || REQUIRED_PACKAGING_FIELDS;
  const reqFields = typeReq.map(normalizeFieldName);

  // 1. Initialize default required fields as MISSING
  const fields: Record<string, ComputedField> = {};

  for (const reqField of reqFields) {
    fields[reqField] = {
      field: reqField,
      label: FIELD_LABELS[reqField] || reqField,
      value: null,
      status: "MISSING",
      evidence: [],
      history: [],
      isRequired: true,
    };
  }

  // 2. Sort events chronologically (earliest to latest)
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  // Track latest actor per field
  const latestActorPerField: Record<string, "ai" | "human"> = {};

  // 3. Replay each event
  for (const event of sortedEvents) {
    const fieldKey = normalizeFieldName(event.field);
    latestActorPerField[fieldKey] = event.actor;

    if (!fields[fieldKey]) {
      fields[fieldKey] = {
        field: fieldKey,
        label: FIELD_LABELS[fieldKey] || fieldKey,
        value: null,
        status: "MISSING",
        evidence: [],
        history: [],
        isRequired: REQUIRED_PACKAGING_FIELDS.includes(fieldKey as any),
      };
    }

    const current = fields[fieldKey];

    // If current had a value, push to history
    if (current.value !== null) {
      current.history.push({
        value: current.value,
        unit: current.unit,
        status: current.status,
        actor: current.evidence[current.evidence.length - 1]?.actor || "ai",
        timestamp: current.evidence[current.evidence.length - 1]?.timestamp || new Date(),
      });
    }

    // Determine new status based on actor and confirmation rule
    let resolvedStatus: FieldStatus = event.status;

    if (event.actor === "human") {
      if (event.confirmation === "confirmed") {
        resolvedStatus = "CONFIRMED";
      } else if (event.confirmation === "rejected") {
        resolvedStatus = "CONFLICTING";
      } else {
        resolvedStatus = "CONFIRMED";
      }
    } else {
      // AI actor
      if (event.status === "CONFLICTING") {
        resolvedStatus = "CONFLICTING";
      } else if (event.status === "INFERRED") {
        resolvedStatus = "INFERRED"; // Rule: deltas/refs remain INFERRED until human confirms
      } else if (event.status === "CONFIRMED") {
        resolvedStatus = "CONFIRMED"; // Rule: explicit statement
      }
    }

    // If event updates dimensions via height/width/length
    if (fieldKey === "height" && !fields["dimensions"].value) {
      // Keep height tracked, and if dimensions is missing, populate partial reference
      if (fields["dimensions"].status === "MISSING") {
        fields["dimensions"].value = `Height: ${event.newValue}${event.unit ? " " + event.unit : ""}`;
        fields["dimensions"].status = resolvedStatus;
      }
    }

    // Apply new value
    current.value = event.newValue;
    current.unit = event.unit || current.unit;
    current.status = resolvedStatus;

    // Append evidence
    if (event.source?.quote || event.actor === "human") {
      current.evidence.push({
        messageId: event.source?.messageId,
        quote: event.source?.quote,
        actor: event.actor,
        timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp),
        note: event.note,
      });
    }
  }

  // 4. Apply detected conflicts (unless resolved by a human operator)
  if (conflicts) {
    for (const [confField, confDetail] of Object.entries(conflicts)) {
      const fieldKey = normalizeFieldName(confField);
      if (fields[fieldKey]) {
        // If the latest event for this field was NOT by a human operator, mark CONFLICTING
        if (latestActorPerField[fieldKey] !== "human") {
          fields[fieldKey].status = "CONFLICTING";
          fields[fieldKey].conflict = confDetail;
        }
      }
    }
  }

  // 5. Check missing required fields and compute overall status
  const missingFields: string[] = [];
  let inferredCount = 0;
  let confirmedCount = 0;
  let conflictingCount = 0;

  for (const reqField of reqFields) {
    if (!fields[reqField] || fields[reqField].value === null || fields[reqField].status === "MISSING") {
      if (fields[reqField]) {
        fields[reqField].status = "MISSING";
      }
      missingFields.push(reqField);
    }
  }

  for (const f of Object.values(fields)) {
    if (f.status === "CONFLICTING") conflictingCount++;
    if (f.status === "INFERRED") inferredCount++;
    if (f.status === "CONFIRMED") confirmedCount++;
  }

  const allRequiredPresent = missingFields.length === 0;

  // Phase 6 Rule: Order status moves NEEDS_REVIEW -> CONFIRMED only when no MISSING/CONFLICTING/INFERRED required fields remain
  let overallStatus: OrderStatus = "DRAFT";
  if (conflictingCount > 0 || inferredCount > 0) {
    overallStatus = "NEEDS_REVIEW";
  } else if (allRequiredPresent && conflictingCount === 0 && inferredCount === 0) {
    overallStatus = "CONFIRMED";
  } else {
    overallStatus = "DRAFT";
  }

  return {
    fields,
    overallStatus,
    allRequiredPresent,
    missingFields,
    inferredCount,
    confirmedCount,
    conflictingCount,
  };
}
