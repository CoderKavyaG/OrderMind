import { describe, it, expect } from "vitest";
import { replayOrderEvents, REQUIRED_PACKAGING_FIELDS } from "@/server/services/orderReducer";
import type { OrderEventDoc, ExtractedEvent } from "@/server/db/schema";
import {
  syncExtractedEventsToOrder,
  applyHumanOrderAction,
  getOrderDetails,
  listOrders,
} from "@/server/services/order.service";
import { ObjectId } from "mongodb";

describe("Phase 5: Order State Engine - Pure Reducer", () => {
  const baseEvent: OrderEventDoc = {
    workspaceId: "ws-123",
    orderId: "ord-456",
    timestamp: new Date("2026-10-02T10:00:00Z"),
    createdAt: new Date("2026-10-02T10:00:00Z"),
    field: "quantity",
    newValue: 100,
    unit: "pcs",
    status: "CONFIRMED",
    source: { messageId: "msg-1", quote: "I need 100 boxes" },
    actor: "ai",
    confirmation: "confirmed",
  };

  it("marks all required packaging fields as MISSING when no events have occurred", () => {
    const reduced = replayOrderEvents([]);

    expect(reduced.overallStatus).toBe("DRAFT");
    expect(reduced.allRequiredPresent).toBe(false);
    expect(reduced.missingFields).toEqual(expect.arrayContaining([...REQUIRED_PACKAGING_FIELDS]));
    expect(reduced.fields["quantity"].status).toBe("MISSING");
    expect(reduced.fields["quantity"].value).toBeNull();
  });

  it("supersedes earlier events with later ones while keeping previous value in history", () => {
    const event1: OrderEventDoc = {
      ...baseEvent,
      timestamp: new Date("2026-10-02T10:00:00Z"),
      newValue: 100,
      source: { messageId: "msg-1", quote: "100 boxes initially" },
    };

    const event2: OrderEventDoc = {
      ...baseEvent,
      timestamp: new Date("2026-10-02T10:05:00Z"),
      newValue: 500,
      source: { messageId: "msg-2", quote: "change that to 500 boxes please" },
    };

    const reduced = replayOrderEvents([event1, event2]);

    expect(reduced.fields["quantity"].value).toBe(500);
    expect(reduced.fields["quantity"].status).toBe("CONFIRMED");
    // Verify audit history is preserved
    expect(reduced.fields["quantity"].history).toHaveLength(1);
    expect(reduced.fields["quantity"].history[0].value).toBe(100);
    // Verify both evidence quotes are recorded
    expect(reduced.fields["quantity"].evidence).toHaveLength(2);
    expect(reduced.fields["quantity"].evidence[0].quote).toBe("100 boxes initially");
    expect(reduced.fields["quantity"].evidence[1].quote).toBe("change that to 500 boxes please");
  });

  it("maintains INFERRED status for relative delta/ref claims until human operator confirms", () => {
    const deltaEvent: OrderEventDoc = {
      workspaceId: "ws-123",
      orderId: "ord-456",
      timestamp: new Date("2026-10-02T10:10:00Z"),
      createdAt: new Date("2026-10-02T10:10:00Z"),
      field: "height",
      newValue: "a little taller (+15mm)",
      unit: "mm",
      status: "INFERRED",
      source: { messageId: "msg-3", quote: "make it a little taller" },
      actor: "ai",
      confirmation: "pending",
      note: "Delta reference extracted",
    };

    const reduced = replayOrderEvents([deltaEvent]);

    expect(reduced.fields["height"].status).toBe("INFERRED");
    expect(reduced.fields["height"].value).toBe("a little taller (+15mm)");
    expect(reduced.inferredCount).toBeGreaterThan(0);
    expect(reduced.overallStatus).toBe("NEEDS_REVIEW");
  });

  it("human operator action flips INFERRED candidate to CONFIRMED", () => {
    const aiEvent: OrderEventDoc = {
      workspaceId: "ws-123",
      orderId: "ord-456",
      timestamp: new Date("2026-10-02T10:10:00Z"),
      createdAt: new Date("2026-10-02T10:10:00Z"),
      field: "dimensions",
      newValue: "same as last time (200x150x80mm)",
      status: "INFERRED",
      source: { messageId: "msg-4", quote: "same as last time" },
      actor: "ai",
      confirmation: "pending",
    };

    const humanConfirmEvent: OrderEventDoc = {
      workspaceId: "ws-123",
      orderId: "ord-456",
      timestamp: new Date("2026-10-02T10:15:00Z"),
      createdAt: new Date("2026-10-02T10:15:00Z"),
      field: "dimensions",
      previousValue: "same as last time (200x150x80mm)",
      newValue: "200 x 150 x 80 mm",
      status: "CONFIRMED",
      source: { quote: "Verified by human operator" },
      actor: "human",
      confirmation: "confirmed",
      note: "Confirmed against historical order #PO-882",
    };

    const reduced = replayOrderEvents([aiEvent, humanConfirmEvent]);

    expect(reduced.fields["dimensions"].status).toBe("CONFIRMED");
    expect(reduced.fields["dimensions"].value).toBe("200 x 150 x 80 mm");
    expect(reduced.fields["dimensions"].history).toHaveLength(1);
    expect(reduced.fields["dimensions"].history[0].status).toBe("INFERRED");
  });

  it("guarantees event immutability: replaying does not modify original event objects", () => {
    const originalEvent: OrderEventDoc = {
      ...baseEvent,
      source: { messageId: "msg-1", quote: "100 boxes" },
    };
    const cloned = JSON.parse(JSON.stringify(originalEvent));

    replayOrderEvents([originalEvent]);

    expect(originalEvent.field).toBe(cloned.field);
    expect(originalEvent.newValue).toBe(cloned.newValue);
    expect(originalEvent.status).toBe(cloned.status);
    expect(originalEvent.actor).toBe(cloned.actor);
  });
});

describe("Phase 5: Order State Engine - Service & Tenant Isolation", () => {
  const workspaceA = new ObjectId().toString();
  const workspaceB = new ObjectId().toString();
  const customerA = new ObjectId().toString();
  const conversationA = new ObjectId().toString();

  it("syncs extracted events into order and persists replayed order fields", async () => {
    const extractedEvents: ExtractedEvent[] = [
      {
        workspaceId: workspaceA,
        conversationId: conversationA,
        field: "product_type",
        value: "Rigid Drawer Box",
        op: "set",
        messageId: "msg-10",
        quote: "We want rigid drawer boxes",
        confidence: 0.95,
        createdAt: new Date(),
      },
      {
        workspaceId: workspaceA,
        conversationId: conversationA,
        field: "quantity",
        value: 1000,
        unit: "units",
        op: "set",
        messageId: "msg-11",
        quote: "Quantity will be 1000 units",
        confidence: 0.98,
        createdAt: new Date(),
      },
      {
        workspaceId: workspaceA,
        conversationId: conversationA,
        field: "finish",
        value: "Matte lamination + Gold foil",
        op: "ref",
        rawPhrase: "same finish as our festive run",
        messageId: "msg-12",
        quote: "same finish as our festive run with gold foil",
        confidence: 0.88,
        createdAt: new Date(),
      },
    ];

    const orderDetails = await syncExtractedEventsToOrder(
      workspaceA,
      conversationA,
      customerA,
      extractedEvents
    );

    expect(orderDetails).toBeDefined();
    expect(orderDetails.workspaceId).toBe(workspaceA);
    expect(orderDetails.reducedState.fields["product_type"].value).toBe("Rigid Drawer Box");
    expect(orderDetails.reducedState.fields["product_type"].status).toBe("CONFIRMED");
    expect(orderDetails.reducedState.fields["quantity"].value).toBe(1000);
    expect(orderDetails.reducedState.fields["quantity"].status).toBe("CONFIRMED");
    // op=ref was mapped to INFERRED
    expect(orderDetails.reducedState.fields["finish"].status).toBe("INFERRED");
    // because finish is INFERRED, overallStatus should be NEEDS_REVIEW
    expect(orderDetails.status).toBe("NEEDS_REVIEW");
  });

  it("enforces tenant isolation: Workspace B cannot inspect or mutate Workspace A orders", async () => {
    // 1. Create order in Workspace A
    const orderA = await syncExtractedEventsToOrder(
      workspaceA,
      new ObjectId().toString(),
      customerA,
      [
        {
          workspaceId: workspaceA,
          conversationId: "conv-a",
          field: "quantity",
          value: 200,
          op: "set",
          messageId: "msg-a",
          quote: "200 units",
          confidence: 0.9,
          createdAt: new Date(),
        },
      ]
    );

    // 2. Querying with Workspace B returns null
    const resultFromB = await getOrderDetails(workspaceB, orderA.id);
    expect(resultFromB).toBeNull();

    // 3. Workspace B listing does NOT include Workspace A order
    const listB = await listOrders(workspaceB);
    const hasOrderA = listB.some((o) => o.id === orderA.id);
    expect(hasOrderA).toBe(false);

    // 4. Attempting to apply human action from Workspace B is blocked
    await expect(
      applyHumanOrderAction(workspaceB, orderA.id, {
        field: "quantity",
        action: "confirm",
        actorEmail: "attacker@workspaceb.com",
      })
    ).rejects.toThrow("Order not found or access denied");
  });

  it("human operator action creates human order_event and updates field", async () => {
    // 1. Create order in Workspace A
    const order = await syncExtractedEventsToOrder(
      workspaceA,
      new ObjectId().toString(),
      customerA,
      [
        {
          workspaceId: workspaceA,
          conversationId: "conv-b",
          field: "finish",
          value: "Gold foil stamp",
          op: "ref",
          messageId: "msg-ref",
          quote: "gold foil logo like last time",
          confidence: 0.85,
          createdAt: new Date(),
        },
      ]
    );

    expect(order.reducedState.fields["finish"].status).toBe("INFERRED");

    // 2. Operator confirms the specification
    const updated = await applyHumanOrderAction(workspaceA, order.id, {
      field: "finish",
      action: "confirm",
      newValue: "Matte Black with Gold Foil Stamping",
      actorEmail: "lead.estimator@packco.com",
      note: "Confirmed with customer Aarav",
    });

    expect(updated.reducedState.fields["finish"].status).toBe("CONFIRMED");
    expect(updated.reducedState.fields["finish"].value).toBe("Matte Black with Gold Foil Stamping");

    // 3. Verify an event with actor='human' was appended
    const lastEvent = updated.events[updated.events.length - 1];
    expect(lastEvent.actor).toBe("human");
    expect(lastEvent.confirmation).toBe("confirmed");
  });

  it("creates a snapshot in order_versions when order reaches CONFIRMED status", async () => {
    // Fulfill all required fields for a packaging order
    const convId = new ObjectId().toString();
    const fullSpecs: ExtractedEvent[] = [
      { workspaceId: workspaceA, conversationId: convId, field: "product_type", value: "Mailer Box", op: "set", messageId: "m1", quote: "mailer boxes", confidence: 0.9, createdAt: new Date() },
      { workspaceId: workspaceA, conversationId: convId, field: "quantity", value: 500, op: "set", messageId: "m2", quote: "500 pieces", confidence: 0.9, createdAt: new Date() },
      { workspaceId: workspaceA, conversationId: convId, field: "dimensions", value: "300 x 200 x 100 mm", op: "set", messageId: "m3", quote: "300x200x100mm", confidence: 0.9, createdAt: new Date() },
      { workspaceId: workspaceA, conversationId: convId, field: "material", value: "350 GSM White SBS", op: "set", messageId: "m4", quote: "350 gsm white board", confidence: 0.9, createdAt: new Date() },
      { workspaceId: workspaceA, conversationId: convId, field: "finish", value: "Matte Lamination", op: "set", messageId: "m5", quote: "matte lamination", confidence: 0.9, createdAt: new Date() },
      { workspaceId: workspaceA, conversationId: convId, field: "printing", value: "4-color CMYK outside", op: "set", messageId: "m6", quote: "full cmyk printing", confidence: 0.9, createdAt: new Date() },
      { workspaceId: workspaceA, conversationId: convId, field: "deadline", value: "2026-11-15", op: "set", messageId: "m7", quote: "need by Nov 15", confidence: 0.9, createdAt: new Date() },
    ];

    const order = await syncExtractedEventsToOrder(
      workspaceA,
      convId,
      customerA,
      fullSpecs
    );

    // Operator confirms the final spec to trigger version snapshot
    const confirmedOrder = await applyHumanOrderAction(workspaceA, order.id, {
      field: "deadline",
      action: "confirm",
      actorEmail: "ops@packco.com",
    });

    expect(confirmedOrder.status).toBe("CONFIRMED");
    expect(confirmedOrder.versions.length).toBeGreaterThanOrEqual(1);
    expect(confirmedOrder.versions[0].confirmedBy).toBe("ops@packco.com");
    const snapshotObj = confirmedOrder.versions[0].snapshot as Record<string, { value: unknown }>;
    expect(snapshotObj["quantity"].value).toBe(500);
  });
});
