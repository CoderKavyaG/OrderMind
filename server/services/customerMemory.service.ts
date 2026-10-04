import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import type { CustomerMemoryDoc, MemoryKind, Customer, OrderDoc } from "@/server/db/schema";
import { getLLMProvider } from "@/server/ai";

export interface CreateMemoryInput {
  customerId: string;
  brandId?: string;
  fact: string;
  kind?: MemoryKind;
  verified?: boolean;
  source?: {
    orderId?: string;
    messageId?: string;
    note?: string;
  };
}

/**
 * Lists all customer memories scoped by workspace, optionally filtered by customer.
 */
export async function listCustomerMemories(
  workspaceId: string,
  filterOrCustomerId?: string | { customerId?: string; brandId?: string; search?: string }
): Promise<Array<CustomerMemoryDoc & { id: string; customerName?: string }>> {
  const db = await getDb();
  const query: Record<string, unknown> = { workspaceId };
  
  if (typeof filterOrCustomerId === "string") {
    query.customerId = filterOrCustomerId;
  } else if (filterOrCustomerId) {
    if (filterOrCustomerId.customerId) query.customerId = filterOrCustomerId.customerId;
    if (filterOrCustomerId.brandId) query.brandId = filterOrCustomerId.brandId;
    if (filterOrCustomerId.search) {
      query.fact = { $regex: filterOrCustomerId.search.trim(), $options: "i" };
    }
  }

  const docs = await db
    .collection<CustomerMemoryDoc>("customer_memory")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  if (docs.length === 0) return [];

  // Populate customer names
  const custIds = Array.from(new Set(docs.map((d) => d.customerId))).map(
    (id) => new ObjectId(id)
  );

  const customerDocs = await db
    .collection<Customer>("customers")
    .find({ _id: { $in: custIds }, workspaceId })
    .toArray();

  const customerMap = new Map(customerDocs.map((c) => [c._id!.toString(), c.name]));

  return docs.map((doc) => ({
    ...doc,
    id: doc._id!.toString(),
    customerName: customerMap.get(doc.customerId) || "Customer",
  }));
}

/**
 * Creates a new customer memory entry.
 */
export async function createCustomerMemory(
  workspaceId: string,
  input: CreateMemoryInput
): Promise<CustomerMemoryDoc & { id: string }> {
  const db = await getDb();

  const newDoc: CustomerMemoryDoc = {
    workspaceId,
    customerId: input.customerId,
    brandId: input.brandId,
    fact: input.fact.trim(),
    kind: input.kind || "preference",
    source: input.source || {},
    verified: input.verified ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await db.collection("customer_memory").insertOne(newDoc);
  return {
    ...newDoc,
    id: res.insertedId.toString(),
  };
}

/**
 * Updates a customer memory entry (fact, kind, verified, brandId).
 */
export async function updateCustomerMemory(
  workspaceId: string,
  memoryId: string,
  input: Partial<{
    fact: string;
    kind: MemoryKind;
    verified: boolean;
    brandId: string;
  }>
): Promise<CustomerMemoryDoc & { id: string }> {
  const db = await getDb();
  let memObjectId: ObjectId;
  try {
    memObjectId = new ObjectId(memoryId);
  } catch {
    throw new Error("Invalid memory ID");
  }

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (input.fact !== undefined) updateFields.fact = input.fact.trim();
  if (input.kind !== undefined) updateFields.kind = input.kind;
  if (input.verified !== undefined) updateFields.verified = input.verified;
  if (input.brandId !== undefined) updateFields.brandId = input.brandId;

  await db.collection("customer_memory").updateOne(
    { _id: memObjectId, workspaceId },
    { $set: updateFields }
  );

  const updated = await db
    .collection<CustomerMemoryDoc>("customer_memory")
    .findOne({ _id: memObjectId, workspaceId });

  if (!updated) {
    throw new Error("Memory not found");
  }

  return {
    ...updated,
    id: updated._id!.toString(),
  };
}

/**
 * Toggles or updates the verification status of a customer memory.
 */
export async function verifyCustomerMemory(
  workspaceId: string,
  memoryId: string,
  verified: boolean
): Promise<CustomerMemoryDoc & { id: string }> {
  const db = await getDb();

  let memObjectId: ObjectId;
  try {
    memObjectId = new ObjectId(memoryId);
  } catch {
    throw new Error("Invalid memory ID");
  }

  await db.collection("customer_memory").updateOne(
    { _id: memObjectId, workspaceId },
    {
      $set: {
        verified,
        updatedAt: new Date(),
      },
    }
  );

  const updated = await db
    .collection<CustomerMemoryDoc>("customer_memory")
    .findOne({ _id: memObjectId, workspaceId });

  if (!updated) {
    throw new Error("Memory not found");
  }

  return {
    ...updated,
    id: updated._id!.toString(),
  };
}

/**
 * Deletes a customer memory entry (or rejects a suggested memory).
 */
export async function deleteCustomerMemory(
  workspaceId: string,
  memoryId: string
): Promise<boolean> {
  const db = await getDb();

  let memObjectId: ObjectId;
  try {
    memObjectId = new ObjectId(memoryId);
  } catch {
    return false;
  }

  const res = await db.collection("customer_memory").deleteOne({
    _id: memObjectId,
    workspaceId,
  });

  return (res.deletedCount ?? 0) > 0;
}

/**
 * Analyzes a newly confirmed order and drafts suggested customer memories.
 *
 * HARD RULE:
 * Suggested memories are drafted with verified: false (user accepts or rejects; NEVER auto-saved as verified).
 */
export async function draftSuggestedMemoriesForConfirmedOrder(
  workspaceId: string,
  orderId: string
): Promise<Array<CustomerMemoryDoc & { id: string }>> {
  const db = await getDb();

  let ordObjectId: ObjectId;
  try {
    ordObjectId = new ObjectId(orderId);
  } catch {
    return [];
  }

  const order = await db.collection<OrderDoc>("orders").findOne({
    _id: ordObjectId,
    workspaceId,
  });

  if (!order || order.status !== "CONFIRMED") return [];

  const fields = order.currentFields as Record<string, { value: unknown }>;
  const suggestions: Array<{ fact: string; kind: MemoryKind }> = [];

  // 1. Check material & finish preferences
  const materialVal = fields["material"]?.value;
  const finishVal = fields["finish"]?.value;
  if (materialVal && finishVal) {
    suggestions.push({
      fact: `Customer frequently specifies ${materialVal} with ${finishVal} surface treatment.`,
      kind: "preference",
    });
  } else if (materialVal) {
    suggestions.push({
      fact: `Prefers ${materialVal} board material for custom runs.`,
      kind: "preference",
    });
  }

  // 2. Check dimensions shorthand
  const dimVal = fields["dimensions"]?.value;
  if (dimVal) {
    suggestions.push({
      fact: `Common box sizing: ${dimVal}.`,
      kind: "shorthand",
    });
  }

  // 3. Check printing pattern
  const printVal = fields["printing"]?.value;
  if (printVal) {
    suggestions.push({
      fact: `Standard printing specification is ${printVal}.`,
      kind: "pattern",
    });
  }

  const createdSuggestions: Array<CustomerMemoryDoc & { id: string }> = [];

  for (const s of suggestions) {
    // Check if duplicate fact already exists
    const existing = await db.collection<CustomerMemoryDoc>("customer_memory").findOne({
      workspaceId,
      customerId: order.customerId,
      fact: s.fact,
    });

    if (!existing) {
      const doc: CustomerMemoryDoc = {
        workspaceId,
        customerId: order.customerId,
        fact: s.fact,
        kind: s.kind,
        source: {
          orderId,
          note: `Auto-drafted from confirmed order #${order.orderNumber}`,
        },
        verified: false, // Must be reviewed and verified by user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const res = await db.collection("customer_memory").insertOne(doc);
      createdSuggestions.push({
        ...doc,
        id: res.insertedId.toString(),
      });
    }
  }

  return createdSuggestions;
}
