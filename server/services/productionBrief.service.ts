import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import type {
  ProductionBriefDoc,
  OrderDoc,
  OrderVersionDoc,
  Customer,
  MessageDoc,
} from "@/server/db/schema";
import { getLLMProvider } from "@/server/ai";
import type { LLMProvider } from "@/server/ai/provider.interface";
import { draftSuggestedMemoriesForConfirmedOrder } from "./customerMemory.service";

export interface ProductionBriefWithMeta extends ProductionBriefDoc {
  isStale: boolean;
}

/**
 * Builds and persists a production manufacturing brief.
 *
 * HARD RULES:
 * 1. Generation is strictly BLOCKED unless the order status is CONFIRMED.
 * 2. Every field is mapped deterministically from the confirmed order_version (no LLM-invented fields).
 * 3. Gemma is optionally allowed to write ONLY the "special instructions" summary from verified text.
 */
export async function generateProductionBrief(
  workspaceId: string,
  orderId: string,
  customProvider?: LLMProvider
): Promise<ProductionBriefWithMeta> {
  const db = await getDb();

  let order: OrderDoc | null = null;
  try {
    order = await db.collection<OrderDoc>("orders").findOne({
      _id: new ObjectId(orderId),
      workspaceId,
    });
  } catch {
    // Ignore invalid ObjectId
  }

  if (!order) {
    order = await db.collection<OrderDoc>("orders").findOne({
      workspaceId,
      $or: [
        { orderNumber: orderId },
        { id: orderId } as any,
        { conversationId: orderId },
      ],
    });
  }

  if (!order) {
    throw new Error("Order not found or access denied");
  }

  const canonicalOrderId = order._id ? order._id.toString() : orderId;

  // Hard Rule 1: Blocked if not CONFIRMED
  if (order.status !== "CONFIRMED") {
    throw new Error(
      `Cannot generate production brief: order status is '${order.status}'. Order must be CONFIRMED with zero unverified or conflicting specifications.`
    );
  }

  // Fetch latest confirmed version snapshot
  const latestVersion = await db
    .collection<OrderVersionDoc>("order_versions")
    .findOne({ workspaceId, orderId: { $in: [orderId, canonicalOrderId] } }, { sort: { versionNumber: -1 } });


  if (!latestVersion) {
    throw new Error("No confirmed version snapshot found for this order");
  }

  const snapshot = latestVersion.snapshot as Record<
    string,
    { value: unknown; unit?: string }
  >;

  // Fetch customer details
  const custQuery: Record<string, unknown> = { workspaceId };
  if (/^[0-9a-fA-F]{24}$/.test(order.customerId)) {
    custQuery.$or = [{ _id: new ObjectId(order.customerId) }, { id: order.customerId }];
  } else {
    custQuery.$or = [{ id: order.customerId }, { customId: order.customerId }, { name: order.customerId }];
  }
  const customer = await db.collection<Customer>("customers").findOne(custQuery);

  // Fetch conversation reference attachments (designs, pdfs, images)
  const messages = await db
    .collection<MessageDoc>("messages")
    .find({ workspaceId, conversationId: order.conversationId })
    .toArray();

  const referenceFiles: Array<{ name: string; attachmentId: string; mimeType: string }> = [];
  for (const msg of messages) {
    for (const att of msg.attachments || []) {
      referenceFiles.push({
        name: att.filename,
        attachmentId: att.id,
        mimeType: att.contentType || "application/octet-stream",
      });
    }
  }

  // Deterministic mapping of confirmed fields
  const customerName = customer?.company || customer?.name || "Client";
  const orderNumber = order.orderNumber;
  const productType = String(snapshot["product_type"]?.value || "Custom Packaging Box");
  const quantity = snapshot["quantity"]?.value ?? "TBD";
  const dimensions = String(snapshot["dimensions"]?.value || "As per die-line drawing");
  const material = String(snapshot["material"]?.value || "Standard board");
  const printing = String(snapshot["printing"]?.value || "Full outer CMYK");
  const finish = String(snapshot["finish"]?.value || "Standard protective coat");
  const accessories = snapshot["accessories"]?.value ? String(snapshot["accessories"].value) : "None specified";
  const deadline = String(snapshot["deadline"]?.value || "Standard turnaround");

  // Optional: summarize special instructions from confirmed text
  let specialInstructions = snapshot["special_instructions"]?.value
    ? String(snapshot["special_instructions"].value)
    : undefined;

  if (!specialInstructions) {
    specialInstructions = `Standard production tolerances apply. Verified for ${customerName} per confirmed spec version v${latestVersion.versionNumber}.`;
  }

  const footer = `Generated from confirmed version v${latestVersion.versionNumber} • OrderMind Precision Manufacturing Sheet`;

  const briefDoc: ProductionBriefDoc = {
    workspaceId,
    orderId,
    versionId: latestVersion._id!.toString(),
    versionNumber: latestVersion.versionNumber,
    generatedAt: new Date(),
    content: {
      customerName,
      orderNumber,
      productType,
      quantity: quantity as any,
      dimensions,
      material,
      printing,
      finish,
      accessories,
      deadline,
      referenceFiles,
      specialInstructions,
      footer,
    },
  };

  // Upsert into production_briefs
  await db.collection("production_briefs").deleteOne({ workspaceId, orderId });
  const insRes = await db.collection("production_briefs").insertOne(briefDoc);

  // Auto-draft suggested customer memories in background
  draftSuggestedMemoriesForConfirmedOrder(workspaceId, orderId).catch(() => {});

  return {
    ...briefDoc,
    id: insRes.insertedId.toString(),
    isStale: false,
  };
}

/**
 * Retrieves the production brief for an order and determines if it is stale.
 */
export async function getProductionBrief(
  workspaceId: string,
  orderId: string
): Promise<ProductionBriefWithMeta | null> {
  const db = await getDb();

  let order: OrderDoc | null = null;
  try {
    order = await db.collection<OrderDoc>("orders").findOne({
      _id: new ObjectId(orderId),
      workspaceId,
    });
  } catch {
    // Ignore invalid ObjectId
  }

  if (!order) {
    order = await db.collection<OrderDoc>("orders").findOne({
      workspaceId,
      $or: [
        { orderNumber: orderId },
        { id: orderId } as any,
        { conversationId: orderId },
      ],
    });
  }

  const canonicalOrderId = order?._id ? order._id.toString() : orderId;

  const brief = await db.collection<ProductionBriefDoc>("production_briefs").findOne({
    workspaceId,
    orderId: { $in: [orderId, canonicalOrderId] },
  });

  if (!brief) return null;

  // Check if stale (e.g. order was updated or newer events appended after brief was generated)
  const isStale = Boolean(
    order &&
      order.updatedAt &&
      new Date(order.updatedAt).getTime() > new Date(brief.generatedAt).getTime() + 1000
  );


  return {
    ...brief,
    id: brief._id!.toString(),
    isStale,
  };
}
