import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import type { Customer } from "@/server/db/schema";

export async function listCustomers(workspaceId: string): Promise<Array<Customer & { id: string }>> {
  const db = await getDb();
  const docs = await db
    .collection<Customer>("customers")
    .find({ workspaceId })
    .sort({ name: 1 })
    .toArray();

  return docs.map((d) => ({
    ...d,
    id: d._id!.toString(),
  }));
}

export async function createCustomer(
  workspaceId: string,
  data: {
    name: string;
    phone?: string;
    email?: string;
    company?: string;
    instagram?: string;
    notes?: string;
    tags?: string[];
  }
): Promise<Customer & { id: string }> {
  const db = await getDb();
  const doc = {
    workspaceId,
    name: data.name.trim(),
    phone: data.phone?.trim(),
    email: data.email?.trim(),
    company: data.company?.trim(),
    instagram: data.instagram?.trim(),
    notes: data.notes?.trim(),
    tags: data.tags || [],
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("customers").insertOne(doc);
  return {
    ...doc,
    id: result.insertedId.toString(),
  };
}
