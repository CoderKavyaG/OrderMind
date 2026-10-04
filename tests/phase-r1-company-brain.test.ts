import { describe, it, expect, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import {
  getCompanyBrain,
  updateCompanyBrain,
  resetCompanyBrain,
} from "@/server/services/companyBrain.service";
import { lookupPrice } from "@/server/services/priceLookup.service";
import { createClient, listClients } from "@/server/services/client.service";
import {
  createBrand,
  listBrands,
  createProductSku,
  listProductSkus,
} from "@/server/services/brandSku.service";
import {
  createNote,
  listNotes,
  createTask,
  listTasks,
  updateTaskStatus,
} from "@/server/services/notesTasks.service";
import {
  getOrCreateOrderForConversation,
  transitionLifecycleStage,
  recordStageGateApproval,
} from "@/server/services/order.service";
import { replayOrderEvents } from "@/server/services/orderReducer";
import type { OrderEventDoc } from "@/server/db/schema";

describe("Phase R1: Company Brain, InTheBox Catalogue & Order Model", () => {
  const workspaceA = new ObjectId().toString();
  const workspaceB = new ObjectId().toString();

  it("CompanyBrain initializes with InTheBox packaging catalogue defaults", async () => {
    const brain = await getCompanyBrain(workspaceA);
    expect(brain).toBeDefined();
    expect(brain.workspaceId).toBe(workspaceA);
    expect(brain.version).toBe(1);

    // Services exist
    const categories = brain.services.map((s) => s.category);
    expect(categories).toContain("consultation");
    expect(categories).toContain("design");
    expect(categories).toContain("manufacturing");

    // Price table has InTheBox entries
    const tiers = brain.priceTable.map((p) => p.tierId);
    expect(tiers).toContain("starter-session");
    expect(tiers).toContain("deep-dive-workshop");
    expect(tiers).toContain("advisory-retainer");
    expect(tiers).toContain("design-standard");
    expect(tiers).toContain("mfg-custom-run");

    // Materials and finishes
    expect(brain.materials.length).toBeGreaterThan(3);
    expect(brain.materials).toContain("rigid board");
    expect(brain.finishes).toContain("matte");
    expect(brain.accessories).toContain("inserts");
    expect(brain.policies.length).toBeGreaterThan(0);
    expect(brain.outOfScope.length).toBeGreaterThan(0);
  });

  it("CompanyBrain updates increment version and isolate between workspaces", async () => {
    const updated = await updateCompanyBrain(workspaceA, {
      materials: ["Custom Bio Board", "Recycled Flute"],
    });

    expect(updated.version).toBe(2);
    expect(updated.materials).toEqual(["Custom Bio Board", "Recycled Flute"]);

    // Workspace B remains isolated with default version 1
    const brainB = await getCompanyBrain(workspaceB);
    expect(brainB.version).toBe(1);
    expect(brainB.materials).toContain("rigid board");
  });

  it("CompanyBrain reset restores InTheBox standards", async () => {
    const reset = await resetCompanyBrain(workspaceA);
    expect(reset.materials).toContain("rigid board");
    expect(reset.version).toBeGreaterThan(2);
  });

  describe("Deterministic Price Lookup", () => {
    it("returns fixed price for Consultation Starter (2,000 INR)", async () => {
      const res = await lookupPrice(workspaceA, {
        category: "consultation",
        tierId: "starter-session",
      });

      expect(res.status).toBe("CONFIRMED");
      expect(res.priceINR).toBe(2000);
      expect(res.quoteRequired).toBe(false);
      expect(res.unit).toBe("per 1hr session");
    });

    it("multiplies Retainer consultation by number of months", async () => {
      const res = await lookupPrice(workspaceA, {
        category: "consultation",
        tierId: "advisory-retainer",
        months: 3,
      });

      expect(res.status).toBe("CONFIRMED");
      expect(res.priceINR).toBe(36000); // 12000 * 3
      expect(res.quoteRequired).toBe(false);
    });

    it("multiplies Design pricing by number of SKUs", async () => {
      const res = await lookupPrice(workspaceA, {
        category: "design",
        tierId: "design-standard",
        skuCount: 2,
      });

      expect(res.status).toBe("CONFIRMED");
      expect(res.priceINR).toBe(16000); // 8000 * 2
      expect(res.quoteRequired).toBe(false);
    });

    it("strictly returns NEEDS_QUOTE and null price for Manufacturing orders", async () => {
      const res = await lookupPrice(workspaceA, {
        category: "manufacturing",
        tierId: "mfg-custom-run",
        quantity: 500,
      });

      expect(res.status).toBe("NEEDS_QUOTE");
      expect(res.priceINR).toBeNull();
      expect(res.quoteRequired).toBe(true);
      expect(res.leadTimeDays).toBe("15-30 business days");
      expect(res.requiresAdvance).toBe(true);
      expect(res.requiresDesignApproval).toBe(true);
    });
  });

  describe("Client, Brand, and Product SKU Isolation", () => {
    it("creates client and enforces workspace isolation", async () => {
      const client = await createClient(workspaceA, {
        name: "Aarav Gupta",
        company: "Craft Artisans Ltd",
        phone: "+91 98765 43210",
        instagram: "@craftartisans",
        tags: ["luxury", "d2c"],
      });

      expect(client.id).toBeDefined();
      expect(client.workspaceId).toBe(workspaceA);
      expect(client.name).toBe("Aarav Gupta");

      // Verify list
      const listA = await listClients(workspaceA);
      expect(listA.some((c) => c.name === "Aarav Gupta")).toBe(true);

      // Workspace B cannot see client
      const listB = await listClients(workspaceB);
      expect(listB.some((c) => c.name === "Aarav Gupta")).toBe(false);
    });

    it("creates brand and product SKU scoped by client and brand", async () => {
      const client = await createClient(workspaceA, {
        name: "Rhea Sen",
        company: "Botanica Organics",
      });

      const brand = await createBrand(workspaceA, {
        clientId: client.id,
        name: "Botanica Skincare",
        notes: "Ayurvedic skincare line",
      });

      expect(brand.id).toBeDefined();
      expect(brand.clientId).toBe(client.id);

      const sku = await createProductSku(workspaceA, {
        brandId: brand.id,
        name: "Serum Rigid Box",
        structure: "Shoulder & Neck Rigid Box",
        dimensions: "120 x 50 x 50 mm",
        materials: "Kappa Board 2mm + 150 GSM Art Paper",
        finish: "Soft-touch Matte + Gold Foil Logo",
        accessories: "High-density EVA foam cutout",
      });

      expect(sku.id).toBeDefined();
      expect(sku.brandId).toBe(brand.id);

      const skus = await listProductSkus(workspaceA, brand.id);
      expect(skus.length).toBe(1);
      expect(skus[0].name).toBe("Serum Rigid Box");

      // Workspace B cannot read sku
      const skusB = await listProductSkus(workspaceB, brand.id);
      expect(skusB.length).toBe(0);
    });
  });

  describe("Notes and Tasks Scoping", () => {
    it("creates notes across workspace, client, and order scopes", async () => {
      const note = await createNote(workspaceA, {
        scope: "workspace",
        content: "Check supplier rates for 350 GSM Kappa board next Monday",
        pinned: true,
      });

      expect(note.id).toBeDefined();
      expect(note.pinned).toBe(true);

      const notes = await listNotes(workspaceA, { scope: "workspace" });
      expect(notes.some((n) => n.content.includes("Check supplier rates"))).toBe(true);

      // Workspace B cannot access note
      const notesB = await listNotes(workspaceB, { scope: "workspace" });
      expect(notesB.length).toBe(0);
    });

    it("creates and toggles tasks", async () => {
      const task = await createTask(workspaceA, {
        type: "approval",
        title: "Send foil die proof to client",
        dueAt: new Date(Date.now() + 86400000),
      });

      expect(task.done).toBe(false);

      const updated = await updateTaskStatus(workspaceA, task.id, true);
      expect(updated.done).toBe(true);
    });
  });

  describe("Order Model: Order Types, Reducer, and Stage-Gate Enforcement", () => {
    it("orderReducer handles consultation required fields", () => {
      const events: OrderEventDoc[] = [
        {
          workspaceId: workspaceA,
          orderId: "ord-test",
          field: "consultation_tier",
          newValue: "Deep Dive (3 hrs)",
          status: "CONFIRMED",
          actor: "human",
          confirmation: "confirmed",
          createdAt: new Date(),
          timestamp: new Date(),
          source: { quote: "Operator confirmed tier" },
        },
      ];

      const reduced = replayOrderEvents(events, undefined, "consultation");
      expect(reduced.fields["consultation_tier"].value).toBe("Deep Dive (3 hrs)");
      expect(reduced.fields["consultation_tier"].status).toBe("CONFIRMED");
      // Missing remaining fields for consultation
      expect(reduced.missingFields).toContain("duration");
      expect(reduced.missingFields).toContain("scheduled_date");
      expect(reduced.overallStatus).toBe("DRAFT");
    });

    it("creates order with default lifecycleStage 'Enquiry' and orderType", async () => {
      const conversationId = new ObjectId().toString();
      const customerId = new ObjectId().toString();

      const order = await getOrCreateOrderForConversation(
        workspaceA,
        conversationId,
        customerId,
        "manufacturing"
      );

      expect(order.orderType).toBe("manufacturing");
      expect(order.lifecycleStage).toBe("Enquiry");
      expect(order.status).toBe("DRAFT");
    });

    it("blocks transition to 'Production' when stage-gate human events are missing", async () => {
      const conversationId = new ObjectId().toString();
      const customerId = new ObjectId().toString();

      const order = await getOrCreateOrderForConversation(
        workspaceA,
        conversationId,
        customerId,
        "manufacturing"
      );

      // Attempting to move straight to Production without design approval or advance payment
      await expect(
        transitionLifecycleStage(workspaceA, order.id, "Production", "operator@ordermind.pack")
      ).rejects.toThrow(/Stage-gate failure: Cannot enter Production without verified human events/);
    });

    it("blocks transition to 'Production' if only one stage-gate is approved", async () => {
      const conversationId = new ObjectId().toString();
      const customerId = new ObjectId().toString();

      const order = await getOrCreateOrderForConversation(
        workspaceA,
        conversationId,
        customerId,
        "manufacturing"
      );

      // Approve only Design
      await recordStageGateApproval(
        workspaceA,
        order.id,
        "design_approved",
        "operator@ordermind.pack",
        "Client signed off PDF dieline proof"
      );

      // Attempt transition to Production: should still fail because advance is not paid
      await expect(
        transitionLifecycleStage(workspaceA, order.id, "Production", "operator@ordermind.pack")
      ).rejects.toThrow(/Advance paid/);
    });

    it("allows transition to 'Production' once both 'Design approved' and 'Advance paid' are recorded", async () => {
      const conversationId = new ObjectId().toString();
      const customerId = new ObjectId().toString();

      const order = await getOrCreateOrderForConversation(
        workspaceA,
        conversationId,
        customerId,
        "manufacturing"
      );

      // Approve Design
      await recordStageGateApproval(
        workspaceA,
        order.id,
        "design_approved",
        "operator@ordermind.pack",
        "Client signed off PDF dieline proof"
      );

      // Approve Advance Payment
      await recordStageGateApproval(
        workspaceA,
        order.id,
        "advance_paid",
        "accounts@ordermind.pack",
        "Received 50% advance via NEFT reference 8392"
      );

      // Now transitioning to Production succeeds!
      const updatedOrder = await transitionLifecycleStage(
        workspaceA,
        order.id,
        "Production",
        "operator@ordermind.pack"
      );

      expect(updatedOrder.lifecycleStage).toBe("Production");
    });
  });
});
