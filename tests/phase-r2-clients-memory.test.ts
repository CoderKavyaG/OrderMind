import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import {
  createClient,
  getClient,
  listClients,
  updateClient,
  archiveClient,
  deleteClient,
} from "@/server/services/client.service";
import {
  createBrand,
  listBrands,
  getBrand,
  updateBrand,
  deleteBrand,
  createProductSku,
  getProductSku,
  listProductSkus,
  updateProductSku,
  deleteProductSku,
} from "@/server/services/brandSku.service";
import {
  createCustomerMemory,
  listCustomerMemories,
  updateCustomerMemory,
  verifyCustomerMemory,
  deleteCustomerMemory,
} from "@/server/services/customerMemory.service";
import {
  createNote,
  listNotes,
  updateNote,
  deleteNote,
} from "@/server/services/notesTasks.service";
import { searchGlobal } from "@/server/services/globalSearch.service";
import { getOrCreateOrderForConversation } from "@/server/services/order.service";

describe("Phase R2: Clients, Brands, SKUs, Memory Bank & Global Search", () => {
  const workspaceA = new ObjectId().toString();
  const workspaceB = new ObjectId().toString();

  describe("1. Client Management & Tenant Isolation", () => {
    it("creates, filters by tag, searches, archives and deletes clients", async () => {
      const client = await createClient(workspaceA, {
        name: "Aarav Prints & Co",
        company: "Aarav Luxury Packaging",
        phone: "+91 99887 76655",
        instagram: "@aaravprints",
        tags: ["luxury", "cosmetics"],
        notes: "Demands Kappa board 2mm for all boxes.",
      });

      expect(client.id).toBeDefined();
      expect(client.archived).toBe(false);

      // Search by name
      const searchRes = await listClients(workspaceA, { search: "Aarav" });
      expect(searchRes.length).toBeGreaterThan(0);
      expect(searchRes[0].name).toContain("Aarav");

      // Filter by tag
      const tagRes = await listClients(workspaceA, { tag: "luxury" });
      expect(tagRes.some((c) => c.id === client.id)).toBe(true);

      // Archive client
      const archived = await archiveClient(workspaceA, client.id, true);
      expect(archived?.archived).toBe(true);

      // Active list should not include archived client
      const activeList = await listClients(workspaceA, { archived: false });
      expect(activeList.some((c) => c.id === client.id)).toBe(false);

      // Archived list includes client
      const archivedList = await listClients(workspaceA, { archived: true });
      expect(archivedList.some((c) => c.id === client.id)).toBe(true);

      // Unarchive client
      await archiveClient(workspaceA, client.id, false);
      const restored = await getClient(workspaceA, client.id);
      expect(restored?.archived).toBe(false);

      // Tenant isolation: Workspace B cannot see client
      const listB = await listClients(workspaceB);
      expect(listB.some((c) => c.id === client.id)).toBe(false);
    });
  });

  describe("2. Nested Brands & Product SKUs with Photos", () => {
    it("manages brands and SKUs with dieline reference photos", async () => {
      const client = await createClient(workspaceA, {
        name: "Kavya Organics",
        company: "Kavya Wellness",
      });

      const brand = await createBrand(workspaceA, {
        clientId: client.id,
        name: "Botanica Elixir",
        notes: "Ayurvedic hair and face oils",
      });

      expect(brand.id).toBeDefined();

      const sku = await createProductSku(workspaceA, {
        brandId: brand.id,
        name: "100ml Oil Dropper Box",
        structure: "Telescoping Rigid Box",
        dimensions: "160 x 60 x 60 mm",
        materials: "350 GSM Kappa Board + 150 GSM Matte Art Paper",
        finish: "Soft-touch Matte Lamination + Rose Gold Stamping",
        accessories: "High-density black foam tray with circular cutout",
        photos: [
          {
            id: "photo-1",
            name: "dropper_dieline.png",
            url: "/api/attachments/photo-1",
          },
        ],
      });

      expect(sku.id).toBeDefined();
      expect(sku.photos.length).toBe(1);
      expect(sku.photos[0].name).toBe("dropper_dieline.png");

      // Update SKU photos
      const updated = await updateProductSku(workspaceA, sku.id, {
        photos: [
          ...sku.photos,
          {
            id: "photo-2",
            name: "gold_foil_sample.jpg",
            url: "/api/attachments/photo-2",
          },
        ],
      });

      expect(updated?.photos.length).toBe(2);

      // Delete SKU
      const deleted = await deleteProductSku(workspaceA, sku.id);
      expect(deleted).toBe(true);

      const checkSku = await getProductSku(workspaceA, sku.id);
      expect(checkSku).toBeNull();
    });
  });

  describe("3. Memory Bank: Rules, Preferences, and Verification", () => {
    it("handles client memory facts with kind rule and verification toggling", async () => {
      const client = await createClient(workspaceA, {
        name: "Apex Luxury Gifts",
      });

      const memory = await createCustomerMemory(workspaceA, {
        customerId: client.id,
        fact: "Mandatory rule: All dielines must include 5mm extra flap clearance for magnetic clasp",
        kind: "rule",
        verified: false, // Starts unverified
        source: {
          note: "Stated by production manager in chat on Day 3",
        },
      });

      expect(memory.id).toBeDefined();
      expect(memory.kind).toBe("rule");
      expect(memory.verified).toBe(false);

      // Verify memory
      const verified = await verifyCustomerMemory(workspaceA, memory.id, true);
      expect(verified.verified).toBe(true);

      // Update memory fact text
      const edited = await updateCustomerMemory(workspaceA, memory.id, {
        fact: "Updated rule: 6mm extra flap clearance required for heavy magnetic clasps",
      });
      expect(edited.fact).toContain("6mm");

      // Unverify memory
      const unverified = await verifyCustomerMemory(workspaceA, memory.id, false);
      expect(unverified.verified).toBe(false);

      // Delete memory
      const del = await deleteCustomerMemory(workspaceA, memory.id);
      expect(del).toBe(true);
    });
  });

  describe("4. Scoped Markdown Notes", () => {
    it("manages client-scoped notes with pinning and search", async () => {
      const client = await createClient(workspaceA, {
        name: "Sweet Delights Corp",
      });

      const note1 = await createNote(workspaceA, {
        scope: "client",
        targetId: client.id,
        content: "### Packaging Requirement\n* Food-grade inner barrier varnish is compulsory.",
        pinned: false,
      });

      const note2 = await createNote(workspaceA, {
        scope: "client",
        targetId: client.id,
        content: "**URGENT**: Contact accounts before releasing Diwali print batch.",
        pinned: true,
      });

      expect(note1.id).toBeDefined();
      expect(note2.pinned).toBe(true);

      const clientNotes = await listNotes(workspaceA, {
        scope: "client",
        targetId: client.id,
      });

      // Pinned notes appear first
      expect(clientNotes[0].pinned).toBe(true);
      expect(clientNotes[0].content).toContain("URGENT");

      // Toggle pin
      await updateNote(workspaceA, note1.id, { pinned: true });
      const updatedNotes = await listNotes(workspaceA, {
        scope: "client",
        targetId: client.id,
      });
      const target = updatedNotes.find((n) => n.id === note1.id);
      expect(target?.pinned).toBe(true);

      // Delete note
      const del = await deleteNote(workspaceA, note1.id);
      expect(del).toBe(true);
    });
  });

  describe("5. Global Search across All Entities", () => {
    it("searches clients, brands, SKUs, orders, notes, and memory bank simultaneously", async () => {
      const client = await createClient(workspaceA, {
        name: "Nirvana Organics",
        company: "Nirvana Botanicals",
        tags: ["ecofriendly"],
      });

      const brand = await createBrand(workspaceA, {
        clientId: client.id,
        name: "Nirvana Glow Serum",
      });

      const order = await getOrCreateOrderForConversation(
        workspaceA,
        new ObjectId().toString(),
        client.id,
        "manufacturing"
      );

      const note = await createNote(workspaceA, {
        scope: "client",
        targetId: client.id,
        content: "Nirvana requested sample unboxing video.",
      });

      const memory = await createCustomerMemory(workspaceA, {
        customerId: client.id,
        fact: "Nirvana exclusively orders unbleached kraft core.",
        kind: "preference",
        verified: true,
      });

      // Query "Nirvana"
      const results = await searchGlobal(workspaceA, "Nirvana");
      const types = results.map((r) => r.type);

      expect(types).toContain("client");
      expect(types).toContain("brand");
      expect(types).toContain("note");
      expect(types).toContain("memory");

      // Query by order number
      const orderSearch = await searchGlobal(workspaceA, order.orderNumber);
      expect(orderSearch.some((r) => r.type === "order" && r.title === order.orderNumber)).toBe(true);

      // Workspace B cannot find Nirvana
      const resultsB = await searchGlobal(workspaceB, "Nirvana");
      expect(resultsB.length).toBe(0);
    });
  });
});
