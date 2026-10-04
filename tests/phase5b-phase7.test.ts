import { describe, it, expect } from "vitest";
import {
  ElevenLabsTranscriber,
  ManualTranscriber,
  transcribeAndProcessVoiceMessage,
} from "@/server/ai/transcribe";
import {
  getRecentConfirmedOrders,
  resolveReferenceAgainstHistory,
} from "@/server/services/historyRetrieval";
import {
  listCustomerMemories,
  createCustomerMemory,
  verifyCustomerMemory,
  deleteCustomerMemory,
  draftSuggestedMemoriesForConfirmedOrder,
} from "@/server/services/customerMemory.service";
import {
  generateProductionBrief,
  getProductionBrief,
} from "@/server/services/productionBrief.service";
import {
  syncExtractedEventsToOrder,
  applyHumanOrderAction,
} from "@/server/services/order.service";
import { replayOrderEvents } from "@/server/services/orderReducer";
import type { ExtractedEvent, OrderEventDoc } from "@/server/db/schema";
import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";

describe("Phase 5b: Voice Transcription & Customer Memory / History", () => {
  const workspaceId = new ObjectId().toString();
  const customerId = new ObjectId().toString();

  it("ElevenLabsTranscriber falls back gracefully to manual/demo transcriber when no API key is set", async () => {
    delete process.env.ELEVENLABS_API_KEY;

    const transcriber = new ElevenLabsTranscriber();
    const dummyAudio = Buffer.from("fake-audio-bytes");

    const result = await transcriber.transcribe(dummyAudio, "audio/mp3", "note.mp3");

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(10);
    expect(["manual", "fallback"]).toContain(result.provider);
  });

  it("ManualTranscriber preserves custom operator text when provided", async () => {
    const transcriber = new ManualTranscriber(
      "We want 200 boxes of size 200 x 200 x 80 mm with matte lamination."
    );
    const result = await transcriber.transcribe(Buffer.from(""), "audio/mp3");

    expect(result.text).toBe("We want 200 boxes of size 200 x 200 x 80 mm with matte lamination.");
    expect(result.confidence).toBe(1.0);
    expect(result.provider).toBe("manual");
  });

  it("history retrieval resolves reference phrases against the customer's most recent confirmed order version", async () => {
    const db = await getDb();

    // 1. Seed past confirmed order #1
    const order1Id = new ObjectId().toString();
    await db.collection("orders").insertOne({
      _id: new ObjectId(order1Id),
      workspaceId,
      customerId,
      orderNumber: "ORD-0081",
      status: "CONFIRMED",
      currentFields: {
        material: { value: "250 GSM Duplex board" },
      },
      createdAt: new Date("2026-01-01T10:00:00Z"),
      updatedAt: new Date("2026-01-01T11:00:00Z"),
    });
    await db.collection("order_versions").insertOne({
      workspaceId,
      orderId: order1Id,
      versionNumber: 1,
      snapshot: { material: { value: "250 GSM Duplex board" } },
      confirmedBy: "lead@packco.com",
      createdAt: new Date("2026-01-01T11:00:00Z"),
    });

    // 2. Seed past confirmed order #2 (more recent)
    const order2Id = new ObjectId().toString();
    await db.collection("orders").insertOne({
      _id: new ObjectId(order2Id),
      workspaceId,
      customerId,
      orderNumber: "ORD-0095",
      status: "CONFIRMED",
      currentFields: {
        material: { value: "350 GSM White SBS board" },
        finish: { value: "Velvet Matte with Gold Foil" },
      },
      createdAt: new Date("2026-02-01T10:00:00Z"),
      updatedAt: new Date("2026-02-01T12:00:00Z"),
    });
    await db.collection("order_versions").insertOne({
      workspaceId,
      orderId: order2Id,
      versionNumber: 1,
      snapshot: {
        material: { value: "350 GSM White SBS board" },
        finish: { value: "Velvet Matte with Gold Foil" },
      },
      confirmedBy: "lead@packco.com",
      createdAt: new Date("2026-02-01T12:00:00Z"),
    });

    // Resolve reference "same material as last time"
    const resolved = await resolveReferenceAgainstHistory(workspaceId, customerId, "material");

    expect(resolved).not.toBeNull();
    // Must pick the latest confirmed order (ORD-0095, 350 GSM White SBS board)
    expect(resolved?.resolvedValue).toBe("350 GSM White SBS board");
    expect(resolved?.sourceOrderNumber).toBe("ORD-0095");
  });

  it("HARD RULE: customer memory and history can only produce INFERRED status and NEVER override an explicit current customer statement", async () => {
    // Current conversation has both a memory/history reference and an explicit override
    const events: OrderEventDoc[] = [
      {
        workspaceId,
        orderId: "ord-test",
        field: "material",
        newValue: "350 GSM White SBS board", // from history ("same as last time")
        status: "INFERRED",
        source: { quote: "Material same as last time" },
        actor: "ai",
        confirmation: "pending",
        timestamp: new Date("2026-10-02T10:00:00Z"),
        createdAt: new Date("2026-10-02T10:00:00Z"),
      },
      {
        workspaceId,
        orderId: "ord-test",
        field: "material",
        newValue: "450 GSM Kraft Board", // Explicit statement made by customer in current chat
        status: "CONFIRMED",
        source: { quote: "Actually we want 450 GSM Kraft Board for this project" },
        actor: "ai",
        confirmation: "confirmed",
        timestamp: new Date("2026-10-02T10:05:00Z"),
        createdAt: new Date("2026-10-02T10:05:00Z"),
      },
    ];

    const reduced = replayOrderEvents(events);

    // Explicit statement must supersede historical memory
    expect(reduced.fields["material"].value).toBe("450 GSM Kraft Board");
    expect(reduced.fields["material"].status).toBe("CONFIRMED");
    // Historical memory value is preserved in history, not active value
    expect(reduced.fields["material"].history[0].value).toBe("350 GSM White SBS board");
    expect(reduced.fields["material"].history[0].status).toBe("INFERRED");
  });

  it("manages customer memory lifecycle (create, list, verify toggle, delete)", async () => {
    const memory = await createCustomerMemory(workspaceId, {
      customerId,
      fact: "Customer prefers magnetic closure rigid boxes for premium confectionery.",
      kind: "preference",
      verified: false,
    });

    expect(memory.id).toBeDefined();
    expect(memory.verified).toBe(false);

    // List memories
    const list = await listCustomerMemories(workspaceId, customerId);
    expect(list.some((m) => m.id === memory.id)).toBe(true);

    // Verify toggle
    const verified = await verifyCustomerMemory(workspaceId, memory.id, true);
    expect(verified.verified).toBe(true);

    // Delete
    const deleted = await deleteCustomerMemory(workspaceId, memory.id);
    expect(deleted).toBe(true);
  });
});

describe("Phase 7: Production Brief", () => {
  const workspaceId = new ObjectId().toString();
  const customerId = new ObjectId().toString();
  const convId = new ObjectId().toString();

  it("HARD RULE: production brief generation is BLOCKED if order status is not CONFIRMED", async () => {
    const draftSpecs: ExtractedEvent[] = [
      { workspaceId, conversationId: convId, field: "product_type", value: "Mailer Box", op: "set", messageId: "m1", quote: "mailer boxes", confidence: 0.95, createdAt: new Date() },
    ];

    const draftOrder = await syncExtractedEventsToOrder(workspaceId, convId, customerId, draftSpecs);
    expect(draftOrder.status).not.toBe("CONFIRMED");

    // Attempting to generate brief on unconfirmed order must throw
    await expect(generateProductionBrief(workspaceId, draftOrder.id)).rejects.toThrow(
      /order must be CONFIRMED/i
    );
  });

  it("builds production brief deterministically from confirmed order version snapshot", async () => {
    // 1. Create fully confirmed order
    const fullSpecs: ExtractedEvent[] = [
      { workspaceId, conversationId: convId, field: "product_type", value: "Rigid Drawer Box", op: "set", messageId: "m1", quote: "rigid drawer box", confidence: 0.95, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "quantity", value: 1000, op: "set", messageId: "m2", quote: "1000 units", confidence: 0.98, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "dimensions", value: "300 x 200 x 100 mm", op: "set", messageId: "m3", quote: "300x200x100mm", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "material", value: "350 GSM White SBS board", op: "set", messageId: "m4", quote: "350 gsm white board", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "finish", value: "Matte Lamination with Gold Foil Stamping", op: "set", messageId: "m5", quote: "matte lamination gold foil", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "printing", value: "4-color CMYK Outside", op: "set", messageId: "m6", quote: "full cmyk outside", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "deadline", value: "2026-11-20", op: "set", messageId: "m7", quote: "deliver by Nov 20", confidence: 0.9, createdAt: new Date() },
    ];

    const order = await syncExtractedEventsToOrder(workspaceId, convId, customerId, fullSpecs);

    // Operator locks the order
    const confirmedOrder = await applyHumanOrderAction(workspaceId, order.id, {
      action: "confirm_all",
      actorEmail: "lead.operator@packco.com",
    });

    expect(confirmedOrder.status).toBe("CONFIRMED");

    // 2. Generate brief
    const brief = await generateProductionBrief(workspaceId, confirmedOrder.id);

    expect(brief).toBeDefined();
    expect(brief.isStale).toBe(false);
    expect(brief.content.productType).toBe("Rigid Drawer Box");
    expect(brief.content.quantity).toBe(1000);
    expect(brief.content.dimensions).toBe("300 x 200 x 100 mm");
    expect(brief.content.material).toBe("350 GSM White SBS board");
    expect(brief.content.finish).toBe("Matte Lamination with Gold Foil Stamping");
    expect(brief.content.printing).toBe("4-color CMYK Outside");
    expect(brief.content.deadline).toBe("2026-11-20");
    expect(brief.content.footer).toContain("Generated from confirmed version v1");
  });

  it("flags stale brief when order specifications are updated after brief generation", async () => {
    const fullSpecs: ExtractedEvent[] = [
      { workspaceId, conversationId: new ObjectId().toString(), field: "product_type", value: "Mailer Box", op: "set", messageId: "m1", quote: "mailer boxes", confidence: 0.95, createdAt: new Date() },
      { workspaceId, conversationId: new ObjectId().toString(), field: "quantity", value: 500, op: "set", messageId: "m2", quote: "500 units", confidence: 0.98, createdAt: new Date() },
      { workspaceId, conversationId: new ObjectId().toString(), field: "dimensions", value: "200x150x50mm", op: "set", messageId: "m3", quote: "200x150x50mm", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: new ObjectId().toString(), field: "material", value: "300 GSM Kraft", op: "set", messageId: "m4", quote: "300 gsm kraft", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: new ObjectId().toString(), field: "finish", value: "Matte", op: "set", messageId: "m5", quote: "matte", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: new ObjectId().toString(), field: "printing", value: "1-color Black", op: "set", messageId: "m6", quote: "1-color black", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: new ObjectId().toString(), field: "deadline", value: "2026-12-01", op: "set", messageId: "m7", quote: "dec 1", confidence: 0.9, createdAt: new Date() },
    ];

    const ord = await syncExtractedEventsToOrder(workspaceId, new ObjectId().toString(), customerId, fullSpecs);
    await applyHumanOrderAction(workspaceId, ord.id, { action: "confirm_all" });

    // Generate brief
    const initialBrief = await generateProductionBrief(workspaceId, ord.id);
    expect(initialBrief.isStale).toBe(false);

    // Simulate an order edit taking place 2 seconds later
    const db = await getDb();
    await db.collection("orders").updateOne(
      { _id: new ObjectId(ord.id) },
      { $set: { updatedAt: new Date(Date.now() + 5000) } }
    );

    const fetched = await getProductionBrief(workspaceId, ord.id);
    expect(fetched?.isStale).toBe(true);
  });
});
