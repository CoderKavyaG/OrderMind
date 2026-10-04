import { getDb } from "@/server/db/mongodb";
import { ObjectId } from "mongodb";
import type { Customer, Brand, ProductSku, OrderDoc, Note, CustomerMemoryDoc } from "@/server/db/schema";

export interface SearchResultItem {
  type: "client" | "brand" | "sku" | "order" | "note" | "memory";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export async function searchGlobal(
  workspaceId: string,
  query: string
): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q) return [];

  const db = await getDb();
  const regex = { $regex: q, $options: "i" };
  const results: SearchResultItem[] = [];

  const [clients, brands, skus, orders, notes, memories] = await Promise.all([
    db
      .collection<Customer>("customers")
      .find({
        workspaceId,
        $or: [{ name: regex }, { company: regex }, { tags: regex }, { phone: regex }],
      })
      .limit(5)
      .toArray(),
    db
      .collection<Brand>("brands")
      .find({
        workspaceId,
        $or: [{ name: regex }, { notes: regex }],
      })
      .limit(5)
      .toArray(),
    db
      .collection<ProductSku>("products")
      .find({
        workspaceId,
        $or: [{ name: regex }, { structure: regex }, { materials: regex }],
      })
      .limit(5)
      .toArray(),
    db
      .collection<OrderDoc>("orders")
      .find({
        workspaceId,
        $or: [{ orderNumber: regex }, { status: regex }],
      })
      .limit(5)
      .toArray(),
    db
      .collection<Note>("notes")
      .find({
        workspaceId,
        content: regex,
      })
      .limit(5)
      .toArray(),
    db
      .collection<CustomerMemoryDoc>("customer_memory")
      .find({
        workspaceId,
        fact: regex,
      })
      .limit(5)
      .toArray(),
  ]);

  // Map clients
  for (const c of clients) {
    results.push({
      type: "client",
      id: c._id!.toString(),
      title: c.name,
      subtitle: c.company || "Client Account",
      href: `/customers/${c._id!.toString()}`,
    });
  }

  // Map brands
  for (const b of brands) {
    results.push({
      type: "brand",
      id: b._id!.toString(),
      title: b.name,
      subtitle: b.notes ? `Brand • ${b.notes}` : "Brand",
      href: `/customers/${b.clientId}`,
    });
  }

  // Map SKUs
  for (const s of skus) {
    results.push({
      type: "sku",
      id: s._id!.toString(),
      title: s.name,
      subtitle: `SKU • ${s.structure} (${s.dimensions})`,
      href: `/customers`,
    });
  }

  // Map orders
  for (const o of orders) {
    results.push({
      type: "order",
      id: o._id!.toString(),
      title: o.orderNumber,
      subtitle: `Order • ${o.status} • Stage: ${o.lifecycleStage || "Enquiry"}`,
      href: `/orders/${o._id!.toString()}`,
    });
  }

  // Map notes
  for (const n of notes) {
    results.push({
      type: "note",
      id: n._id!.toString(),
      title: n.content.length > 50 ? `${n.content.slice(0, 50)}...` : n.content,
      subtitle: `Note (${n.scope} scope)`,
      href: n.scope === "client" && n.targetId ? `/customers/${n.targetId}` : `/customers`,
    });
  }

  // Map memories
  for (const m of memories) {
    results.push({
      type: "memory",
      id: m._id!.toString(),
      title: m.fact,
      subtitle: `Memory (${m.kind}) • ${m.verified ? "Verified" : "Unverified"}`,
      href: `/customers/${m.customerId}`,
    });
  }

  return results;
}
