import { getDb } from "@/server/db/mongodb";
import { Client, ClientSchema } from "@/server/db/schema";
import { ObjectId } from "mongodb";

export async function listClients(
  workspaceId: string,
  filter?: { search?: string; tag?: string; archived?: boolean }
): Promise<Array<Client & { id: string }>> {
  const db = await getDb();
  const query: Record<string, any> = { workspaceId };

  if (filter?.archived !== undefined) {
    query.archived = filter.archived;
  } else {
    // Default: hide archived unless requested
    query.archived = { $ne: true };
  }

  if (filter?.tag) {
    query.tags = filter.tag;
  }

  if (filter?.search) {
    const s = filter.search.trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { company: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
      { instagram: { $regex: s, $options: "i" } },
    ];
  }

  const clients = await db
    .collection<Client>("customers")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return clients.map((c) => ({
    ...c,
    id: c._id ? c._id.toString() : "",
  }));
}

export async function getClient(
  workspaceId: string,
  clientId: string
): Promise<(Client & { id: string }) | null> {
  const db = await getDb();
  let queryId: any = clientId;
  try {
    queryId = new ObjectId(clientId);
  } catch {
    // keep string
  }

  const client = await db.collection<Client>("customers").findOne({
    _id: queryId,
    workspaceId,
  });

  if (!client) return null;
  return {
    ...client,
    id: client._id ? client._id.toString() : clientId,
  };
}

export async function createClient(
  workspaceId: string,
  input: {
    name: string;
    company?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    notes?: string;
    tags?: string[];
  }
): Promise<Client & { id: string }> {
  const db = await getDb();
  const newClientDoc: Omit<Client, "_id"> = {
    workspaceId,
    name: input.name.trim(),
    company: input.company?.trim(),
    phone: input.phone?.trim(),
    email: input.email?.trim(),
    instagram: input.instagram?.trim(),
    notes: input.notes?.trim(),
    tags: input.tags || [],
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const parsed = ClientSchema.parse(newClientDoc);
  const result = await db.collection("customers").insertOne(parsed);

  return {
    ...parsed,
    _id: result.insertedId,
    id: result.insertedId.toString(),
  };
}

export async function updateClient(
  workspaceId: string,
  clientId: string,
  input: Partial<{
    name: string;
    company: string;
    phone: string;
    email: string;
    instagram: string;
    notes: string;
    tags: string[];
    archived: boolean;
  }>
): Promise<(Client & { id: string }) | null> {
  const db = await getDb();
  let queryId: any = clientId;
  try {
    queryId = new ObjectId(clientId);
  } catch {
    // keep string
  }

  await db.collection("customers").updateOne(
    { _id: queryId, workspaceId },
    {
      $set: {
        ...input,
        updatedAt: new Date(),
      },
    }
  );

  return getClient(workspaceId, clientId);
}

export async function archiveClient(
  workspaceId: string,
  clientId: string,
  archived: boolean = true
): Promise<(Client & { id: string }) | null> {
  return updateClient(workspaceId, clientId, { archived });
}

export async function deleteClient(
  workspaceId: string,
  clientId: string
): Promise<boolean> {
  const db = await getDb();
  let queryId: any = clientId;
  try {
    queryId = new ObjectId(clientId);
  } catch {
    // keep string
  }

  const result = await db.collection("customers").deleteOne({
    _id: queryId,
    workspaceId,
  });

  return (result.deletedCount ?? 0) > 0;
}
