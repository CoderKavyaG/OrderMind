import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import {
  type OrderQuoteDoc,
  type QuoteLineItem,
  OrderQuoteDocSchema,
} from "@/server/db/schema";

export function calculateQuoteTotal(
  lineItems: QuoteLineItem[] = [],
  materialCostINR: number = 0,
  finishCostINR: number = 0,
  accessoriesCostINR: number = 0
): number {
  const lineItemTotal = lineItems.reduce((acc, item) => acc + (item.totalINR || 0), 0);
  return lineItemTotal + (materialCostINR || 0) + (finishCostINR || 0) + (accessoriesCostINR || 0);
}

export async function getOrderQuote(
  workspaceId: string,
  orderId: string
): Promise<(OrderQuoteDoc & { id: string }) | null> {
  const db = await getDb();
  const quote = await db.collection<OrderQuoteDoc>("order_quotes").findOne({
    workspaceId,
    orderId,
  });

  if (!quote) return null;
  return {
    ...quote,
    id: quote._id?.toString() || quote.id || "",
  };
}

export async function upsertOrderQuote(
  workspaceId: string,
  orderId: string,
  data: {
    status?: "Draft" | "Sent" | "Accepted";
    lineItems?: QuoteLineItem[];
    materialCostINR?: number;
    finishCostINR?: number;
    accessoriesCostINR?: number;
    notes?: string;
  }
): Promise<OrderQuoteDoc & { id: string }> {
  const db = await getDb();

  const existing = await db.collection<OrderQuoteDoc>("order_quotes").findOne({
    workspaceId,
    orderId,
  });

  const lineItems = data.lineItems !== undefined ? data.lineItems : existing?.lineItems || [];
  const materialCostINR = data.materialCostINR !== undefined ? data.materialCostINR : existing?.materialCostINR || 0;
  const finishCostINR = data.finishCostINR !== undefined ? data.finishCostINR : existing?.finishCostINR || 0;
  const accessoriesCostINR = data.accessoriesCostINR !== undefined ? data.accessoriesCostINR : existing?.accessoriesCostINR || 0;
  const totalINR = calculateQuoteTotal(lineItems, materialCostINR, finishCostINR, accessoriesCostINR);
  const status = data.status || existing?.status || "Draft";
  const notes = data.notes !== undefined ? data.notes : existing?.notes;

  const quoteDoc: OrderQuoteDoc = {
    workspaceId,
    orderId,
    status,
    lineItems,
    materialCostINR,
    finishCostINR,
    accessoriesCostINR,
    totalINR,
    notes,
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date(),
  };

  if (existing?._id) {
    await db.collection("order_quotes").updateOne(
      { _id: existing._id, workspaceId },
      { $set: quoteDoc }
    );
    return {
      ...quoteDoc,
      _id: existing._id,
      id: existing._id.toString(),
    };
  } else {
    const res = await db.collection("order_quotes").insertOne(quoteDoc);
    return {
      ...quoteDoc,
      _id: res.insertedId,
      id: res.insertedId.toString(),
    };
  }
}
