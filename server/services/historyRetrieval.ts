import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import type { OrderDoc, OrderVersionDoc } from "@/server/db/schema";
import { normalizeFieldName } from "./orderReducer";
import { traceAgentStage } from "../observability/tracer";

export interface PastMatchingOrder {
  orderId: string;
  orderNumber: string;
  status: string;
  versionNumber: number;
  confirmedAt: Date;
  specs: Record<string, any>;
}

/**
 * Structured MongoDB queries returning the customer's most recent confirmed order_versions.
 * Plain Mongo queries only (No vector search, no Backboard).
 */
export async function getRecentConfirmedOrders(
  workspaceId: string,
  customerId: string,
  currentOrderId?: string,
  limit: number = 5
): Promise<PastMatchingOrder[]> {
  return traceAgentStage(
    "retrieval",
    {
      model: "mongodb-structured-query",
      metadata: { workspaceId, customerId, currentOrderId, limit },
    },
    async () => {
      const db = await getDb();

      const query: Record<string, unknown> = {
        workspaceId,
        customerId,
      };

      if (currentOrderId) {
        try {
          query._id = { $ne: new ObjectId(currentOrderId) };
        } catch {
          //
        }
      }

      // Find confirmed orders or orders with versions
      const pastOrders = await db
        .collection<OrderDoc>("orders")
        .find(query)
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

      if (pastOrders.length === 0) return [];

      const results: PastMatchingOrder[] = [];

      for (const ord of pastOrders) {
        const ordId = ord._id!.toString();
        const latestVersion = await db
          .collection<OrderVersionDoc>("order_versions")
          .findOne(
            { workspaceId, orderId: ordId },
            { sort: { versionNumber: -1 } }
          );

        const specs = latestVersion?.snapshot || ord.currentFields || {};

        results.push({
          orderId: ordId,
          orderNumber: ord.orderNumber,
          status: ord.status,
          versionNumber: latestVersion?.versionNumber || 1,
          confirmedAt: latestVersion?.createdAt || ord.updatedAt || ord.createdAt,
          specs,
        });
      }

      return results;
    }
  );
}

/**
 * Resolves a reference phrase ("same as last time", "like the previous run")
 * against the customer's most recent confirmed order version.
 *
 * HARD RULE:
 * Memory/history can ONLY produce INFERRED values and can NEVER override an explicit current statement.
 */
export async function resolveReferenceAgainstHistory(
  workspaceId: string,
  customerId: string,
  field: string,
  currentOrderId?: string
): Promise<{
  resolvedValue: unknown;
  sourceOrderNumber: string;
  historicalQuote: string;
  unit?: string;
} | null> {
  const pastOrders = await getRecentConfirmedOrders(workspaceId, customerId, currentOrderId, 3);
  if (pastOrders.length === 0) return null;

  const targetField = normalizeFieldName(field);

  for (const past of pastOrders) {
    const fieldObj = past.specs[targetField];
    const val = fieldObj?.value !== undefined ? fieldObj.value : fieldObj;

    if (val !== undefined && val !== null) {
      return {
        resolvedValue: val,
        sourceOrderNumber: past.orderNumber,
        historicalQuote: `Historical Order #${past.orderNumber} Specification`,
        unit: fieldObj?.unit,
      };
    }
  }

  return null;
}
