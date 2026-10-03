import { getCompanyBrain } from "./companyBrain.service";
import { OrderType } from "@/server/db/schema";

export interface PriceLookupInput {
  workspaceId: string;
  orderType?: OrderType;
  category?: OrderType;
  tierId?: string;
  quantity?: number;
  skuCount?: number;
  months?: number;
}

export interface PriceLookupResult {
  orderType: OrderType;
  tierId?: string;
  status: "CONFIRMED" | "NEEDS_QUOTE";
  priceINR: number | null;
  currency: "INR";
  billingUnit: string;
  unit?: string;
  quoteRequired: boolean;
  notes: string;
  leadTime?: string;
  leadTimeDays?: string;
  requiresAdvance?: boolean;
  advanceRequired?: boolean;
  requiresDesignApproval?: boolean;
  designApprovalRequired?: boolean;
}

export async function lookupPrice(
  inputOrWorkspaceId: PriceLookupInput | string,
  maybeOptions?: Partial<PriceLookupInput>
): Promise<PriceLookupResult> {
  let workspaceId: string;
  let orderType: OrderType;
  let tierId: string | undefined;
  let quantity: number | undefined;
  let skuCount: number | undefined;
  let months: number | undefined;

  if (typeof inputOrWorkspaceId === "string") {
    workspaceId = inputOrWorkspaceId;
    orderType = maybeOptions?.orderType || maybeOptions?.category || "manufacturing";
    tierId = maybeOptions?.tierId;
    quantity = maybeOptions?.quantity;
    skuCount = maybeOptions?.skuCount;
    months = maybeOptions?.months;
  } else {
    workspaceId = inputOrWorkspaceId.workspaceId;
    orderType = inputOrWorkspaceId.orderType || inputOrWorkspaceId.category || "manufacturing";
    tierId = inputOrWorkspaceId.tierId;
    quantity = inputOrWorkspaceId.quantity;
    skuCount = inputOrWorkspaceId.skuCount;
    months = inputOrWorkspaceId.months;
  }

  const brain = await getCompanyBrain(workspaceId);

  // HARD RULE: Manufacturing is NEVER auto-priced and always requires custom quote
  if (orderType === "manufacturing") {
    return {
      orderType: "manufacturing",
      tierId: tierId || "mfg-custom-run",
      status: "NEEDS_QUOTE",
      priceINR: null,
      currency: "INR",
      billingUnit: "NEEDS_QUOTE",
      unit: "custom quote",
      quoteRequired: true,
      notes: "Manufacturing price varies by material, size, finish, and accessories => status NEEDS_QUOTE, never auto-priced.",
      leadTime: "15-30 days",
      leadTimeDays: "15-30 business days",
      requiresAdvance: true,
      advanceRequired: true,
      requiresDesignApproval: true,
      designApprovalRequired: true,
    };
  }

  // Consultation lookup
  if (orderType === "consultation") {
    const matched = brain.priceTable.find(
      (entry) =>
        entry.category === "consultation" &&
        (entry.tierId === tierId ||
          entry.tierId.toLowerCase().includes((tierId || "").toLowerCase()) ||
          entry.name.toLowerCase().includes((tierId || "").toLowerCase()))
    );

    const basePrice = matched?.priceINR ?? 2000;
    const resolvedTierId = matched?.tierId ?? "starter-session";
    const billingUnit = matched?.billingUnit ?? "per 1hr session";

    let finalPrice = basePrice;
    if (months && months > 0) {
      finalPrice = basePrice * months;
    }

    return {
      orderType: "consultation",
      tierId: resolvedTierId,
      status: "CONFIRMED",
      priceINR: finalPrice,
      currency: "INR",
      billingUnit,
      unit: billingUnit,
      quoteRequired: false,
      notes: matched?.notes || "Fixed fee consultation session.",
    };
  }

  // Design lookup (per SKU)
  if (orderType === "design") {
    const matched = brain.priceTable.find(
      (entry) =>
        entry.category === "design" &&
        (entry.tierId === tierId ||
          entry.tierId.toLowerCase().includes((tierId || "").toLowerCase()) ||
          entry.name.toLowerCase().includes((tierId || "").toLowerCase()))
    );

    const count = skuCount && skuCount > 0 ? skuCount : quantity && quantity > 0 ? quantity : 1;
    const basePrice = matched?.priceINR ?? 8000;
    const resolvedTierId = matched?.tierId ?? "design-standard";
    const total = basePrice * count;

    return {
      orderType: "design",
      tierId: resolvedTierId,
      status: "CONFIRMED",
      priceINR: total,
      currency: "INR",
      billingUnit: `${matched?.billingUnit || "per SKU"} (x${count} SKU${count > 1 ? "s" : ""})`,
      unit: matched?.billingUnit || "per SKU",
      quoteRequired: false,
      notes: matched?.notes || "Fixed fee packaging design and dieline package.",
    };
  }

  // Fallback
  return {
    orderType,
    status: "NEEDS_QUOTE",
    priceINR: null,
    currency: "INR",
    billingUnit: "NEEDS_QUOTE",
    unit: "custom quote",
    quoteRequired: true,
    notes: "Specification requires manual operator quote.",
  };
}
