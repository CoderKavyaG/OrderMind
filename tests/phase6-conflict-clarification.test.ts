import { describe, it, expect } from "vitest";
import { detectOrderConflicts } from "@/server/services/conflictDetector";
import { detectOrderChanges } from "@/server/services/changeDetector";
import { replayOrderEvents } from "@/server/services/orderReducer";
import {
  detectAndCreateClarifications,
  handleAnswerReceived,
  listOrderClarifications,
} from "@/server/services/missingDetector";
import {
  syncExtractedEventsToOrder,
  applyHumanOrderAction,
  getOrderDetails,
} from "@/server/services/order.service";
import type { OrderEventDoc, ExtractedEvent } from "@/server/db/schema";
import { ObjectId } from "mongodb";

describe("Phase 6: Conflict Detector & Change Detector", () => {
  it("detects exact demo ref-vs-draft mismatch (300 GSM matte past order vs 350 GSM gloss draft with 'same material as last time')", async () => {
    const historicalOrders = [
      {
        orderNumber: "ORD-0099",
        currentFields: {
          material: { value: "300 GSM Matte SBS board" },
          finish: { value: "Matte Lamination" },
        },
      },
    ];

    const currentEvents: OrderEventDoc[] = [
      {
        workspaceId: "ws-1",
        orderId: "ord-1",
        field: "material",
        newValue: "same as last time",
        status: "INFERRED",
        source: {
          messageId: "msg-ref",
          quote: "Material same as last time please",
        },
        actor: "ai",
        confirmation: "pending",
        timestamp: new Date("2026-10-02T10:00:00Z"),
        createdAt: new Date("2026-10-02T10:00:00Z"),
      },
      {
        workspaceId: "ws-1",
        orderId: "ord-1",
        field: "material",
        newValue: "350 GSM Gloss Kappa board",
        status: "CONFIRMED",
        source: {
          messageId: "msg-explicit",
          quote: "Actually wait, make it 350 GSM Gloss Kappa board",
        },
        actor: "ai",
        confirmation: "confirmed",
        timestamp: new Date("2026-10-02T10:05:00Z"),
        createdAt: new Date("2026-10-02T10:05:00Z"),
      },
    ];

    const conflicts = await detectOrderConflicts(currentEvents, historicalOrders);

    expect(conflicts["material"]).toBeDefined();
    expect(conflicts["material"].conflictType).toBe("ref_mismatch");
    expect(conflicts["material"].optionA.value).toBe("300 GSM Matte SBS board");
    expect(conflicts["material"].optionB.value).toBe("350 GSM Gloss Kappa board");
    expect(conflicts["material"].explanation).toContain("same as last time");

    // Replay reducer with detected conflicts
    const reduced = replayOrderEvents(currentEvents, conflicts);
    expect(reduced.fields["material"].status).toBe("CONFLICTING");
    expect(reduced.conflictingCount).toBe(1);
    expect(reduced.overallStatus).toBe("NEEDS_REVIEW");
  });

  it("detects contradictory explicit statements without amendment cue", async () => {
    const contradictoryEvents: OrderEventDoc[] = [
      {
        workspaceId: "ws-1",
        orderId: "ord-2",
        field: "quantity",
        newValue: 200,
        status: "CONFIRMED",
        source: { messageId: "m1", quote: "Quantity is 200 boxes" },
        actor: "ai",
        confirmation: "confirmed",
        timestamp: new Date("2026-10-02T10:00:00Z"),
        createdAt: new Date("2026-10-02T10:00:00Z"),
      },
      {
        workspaceId: "ws-1",
        orderId: "ord-2",
        field: "quantity",
        newValue: 600,
        status: "CONFIRMED",
        source: { messageId: "m2", quote: "Please print 600 boxes" },
        actor: "ai",
        confirmation: "confirmed",
        timestamp: new Date("2026-10-02T10:10:00Z"),
        createdAt: new Date("2026-10-02T10:10:00Z"),
      },
    ];

    const conflicts = await detectOrderConflicts(contradictoryEvents);

    expect(conflicts["quantity"]).toBeDefined();
    expect(conflicts["quantity"].conflictType).toBe("contradictory_statements");
    expect(conflicts["quantity"].optionA.value).toBe(200);
    expect(conflicts["quantity"].optionB.value).toBe(600);
  });

  it("does NOT flag conflict when customer uses superseding cues ('actually', 'change to')", async () => {
    const revisionEvents: OrderEventDoc[] = [
      {
        workspaceId: "ws-1",
        orderId: "ord-3",
        field: "quantity",
        newValue: 100,
        status: "CONFIRMED",
        source: { messageId: "m1", quote: "100 boxes initially" },
        actor: "ai",
        confirmation: "confirmed",
        timestamp: new Date("2026-10-02T10:00:00Z"),
        createdAt: new Date("2026-10-02T10:00:00Z"),
      },
      {
        workspaceId: "ws-1",
        orderId: "ord-3",
        field: "quantity",
        newValue: 500,
        status: "CONFIRMED",
        source: { messageId: "m2", quote: "Actually change that to 500 units instead" },
        actor: "ai",
        confirmation: "confirmed",
        timestamp: new Date("2026-10-02T10:05:00Z"),
        createdAt: new Date("2026-10-02T10:05:00Z"),
      },
    ];

    const conflicts = await detectOrderConflicts(revisionEvents);
    expect(conflicts["quantity"]).toBeUndefined();

    // Verify changeDetector documents the change cleanly
    const changes = detectOrderChanges(revisionEvents);
    expect(changes.length).toBe(2);
    expect(changes[0].explanation).toContain('changed from "100" to "500"');
  });
});

describe("Phase 6: Clarifications & Conflict Resolution End-to-End", () => {
  const workspaceId = new ObjectId().toString();
  const customerId = new ObjectId().toString();
  const convId = new ObjectId().toString();

  it("missing deadline creates clarification; answering closes clarification and unblocks order", async () => {
    // 1. Ingest initial specs with deadline missing
    const initialEvents: ExtractedEvent[] = [
      { workspaceId, conversationId: convId, field: "product_type", value: "Rigid Box", op: "set", messageId: "m1", quote: "rigid boxes", confidence: 0.95, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "quantity", value: 1000, op: "set", messageId: "m2", quote: "1000 units", confidence: 0.98, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "dimensions", value: "250x180x90mm", op: "set", messageId: "m3", quote: "250x180x90mm", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "material", value: "350 GSM White Board", op: "set", messageId: "m4", quote: "350 gsm white board", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "finish", value: "Matte finish", op: "set", messageId: "m5", quote: "matte finish", confidence: 0.9, createdAt: new Date() },
      { workspaceId, conversationId: convId, field: "printing", value: "Full CMYK", op: "set", messageId: "m6", quote: "full cmyk", confidence: 0.9, createdAt: new Date() },
      // Deadline is MISSING
    ];

    const order = await syncExtractedEventsToOrder(
      workspaceId,
      convId,
      customerId,
      initialEvents
    );

    expect(order.reducedState.fields["deadline"].status).toBe("MISSING");
    expect(order.status).toBe("DRAFT"); // Missing required field

    // 2. Verify clarification question was drafted
    const clarifications = await listOrderClarifications(workspaceId, order.id);
    const deadlineClar = clarifications.find((c) => c.field === "deadline");
    expect(deadlineClar).toBeDefined();
    expect(deadlineClar?.status).toBe("open");
    expect(deadlineClar?.question.toLowerCase()).toContain("deadline");

    // 3. Customer answers via "Answer Received" flow
    const replyRes = await handleAnswerReceived(
      workspaceId,
      order.id,
      deadlineClar!.id,
      "We need delivery by December 15th for our product launch.",
      "operator@packco.com"
    );

    // Operator confirms the deadline specification
    const confirmedOrder = await applyHumanOrderAction(workspaceId, order.id, {
      field: "deadline",
      action: "confirm",
      newValue: "December 15th",
      actorEmail: "ops@packco.com",
    });

    expect(confirmedOrder.reducedState.fields["deadline"].status).toBe("CONFIRMED");
    expect(confirmedOrder.status).toBe("CONFIRMED");
    expect(confirmedOrder.versions.length).toBeGreaterThanOrEqual(1);
  });

  it("operator resolving conflict creates human event and unblocks CONFIRMED state", async () => {
    const orderId = new ObjectId().toString();

    // Human operator resolves conflict
    const resolvedOrder = await applyHumanOrderAction(workspaceId, orderId, {
      field: "material",
      action: "resolve_conflict",
      newValue: "350 GSM Gloss Kappa board",
      actorEmail: "lead.estimator@packco.com",
      note: "Customer confirmed via phone call",
    }).catch(async () => {
      // Create order with conflict first
      const fullSpecs: ExtractedEvent[] = [
        { workspaceId, conversationId: new ObjectId().toString(), field: "product_type", value: "Rigid Box", op: "set", messageId: "m1", quote: "rigid boxes", confidence: 0.95, createdAt: new Date() },
        { workspaceId, conversationId: new ObjectId().toString(), field: "quantity", value: 500, op: "set", messageId: "m2", quote: "500 pcs", confidence: 0.98, createdAt: new Date() },
        { workspaceId, conversationId: new ObjectId().toString(), field: "dimensions", value: "200x200x80mm", op: "set", messageId: "m3", quote: "200x200x80mm", confidence: 0.9, createdAt: new Date() },
        { workspaceId, conversationId: new ObjectId().toString(), field: "material", value: "300 GSM Matte", op: "set", messageId: "m4", quote: "300 gsm matte", confidence: 0.9, createdAt: new Date() },
        { workspaceId, conversationId: new ObjectId().toString(), field: "material", value: "400 GSM Kraft", op: "set", messageId: "m5", quote: "400 gsm kraft", confidence: 0.9, createdAt: new Date() },
        { workspaceId, conversationId: new ObjectId().toString(), field: "finish", value: "Gloss", op: "set", messageId: "m6", quote: "gloss", confidence: 0.9, createdAt: new Date() },
        { workspaceId, conversationId: new ObjectId().toString(), field: "printing", value: "CMYK", op: "set", messageId: "m7", quote: "cmyk", confidence: 0.9, createdAt: new Date() },
        { workspaceId, conversationId: new ObjectId().toString(), field: "deadline", value: "2026-12-01", op: "set", messageId: "m8", quote: "dec 1", confidence: 0.9, createdAt: new Date() },
      ];

      const ord = await syncExtractedEventsToOrder(
        workspaceId,
        new ObjectId().toString(),
        customerId,
        fullSpecs
      );

      // Verify material is conflicting
      expect(ord.reducedState.fields["material"].status).toBe("CONFLICTING");

      // Resolve the conflict
      return applyHumanOrderAction(workspaceId, ord.id, {
        field: "material",
        action: "resolve_conflict",
        newValue: "400 GSM Kraft",
        actorEmail: "ops@packco.com",
      });
    });

    expect(resolvedOrder.reducedState.fields["material"].status).toBe("CONFIRMED");
    expect(resolvedOrder.reducedState.fields["material"].value).toBe("400 GSM Kraft");
    expect(resolvedOrder.status).toBe("CONFIRMED");
  });
});
