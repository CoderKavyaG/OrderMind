import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "@/server/db/mongodb";
import {
  getOrCreateOrderForConversation,
  applyHumanOrderAction,
  transitionLifecycleStage,
  recordStageGateApproval,
  updateOrderType,
  createDirectOrder,
  listOrders,
  getOrderDetails,
} from "@/server/services/order.service";
import {
  upsertOrderQuote,
  getOrderQuote,
  calculateQuoteTotal,
} from "@/server/services/orderQuote.service";
import { generateProductionBrief } from "@/server/services/productionBrief.service";
import { ObjectId } from "mongodb";

describe("Phase R4: Order Matrix & Order Workspace", () => {
  const workspaceId = "ws_r4_test";
  const customerId = new ObjectId().toString();

  beforeEach(async () => {
    const db = await getDb();
    await db.collection("orders").deleteMany({ workspaceId });
    await db.collection("order_events").deleteMany({ workspaceId });
    await db.collection("order_versions").deleteMany({ workspaceId });
    await db.collection("order_quotes").deleteMany({ workspaceId });
    await db.collection("production_briefs").deleteMany({ workspaceId });
    await db.collection("customers").deleteMany({ workspaceId });

    // Seed customer
    await db.collection("customers").insertOne({
      _id: new ObjectId(customerId),
      workspaceId,
      name: "Saffron Living Luxury",
      company: "Saffron Living Pvt Ltd",
      tags: ["luxury", "packaging"],
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("1. Stage Gates Enforcement", () => {
    it("strictly blocks transition to Production unless both Design approved and Advance paid are recorded", async () => {
      const order = await createDirectOrder(workspaceId, {
        customerId,
        orderType: "manufacturing",
        initialTitle: "Rigid Box Line",
      });

      // Attempt to jump to Production directly
      await expect(
        transitionLifecycleStage(workspaceId, order.id, "Production", "operator@test.com")
      ).rejects.toThrow(/Stage-gate failure: Cannot enter Production/);

      // Record only Design approved
      await recordStageGateApproval(workspaceId, order.id, "design_approved", "operator@test.com");

      // Still fails because Advance paid is missing
      await expect(
        transitionLifecycleStage(workspaceId, order.id, "Production", "operator@test.com")
      ).rejects.toThrow(/Advance paid/);

      // Record Advance paid
      await recordStageGateApproval(workspaceId, order.id, "advance_paid", "finance@test.com");

      // Now transitioning to Production succeeds!
      const updated = await transitionLifecycleStage(
        workspaceId,
        order.id,
        "Production",
        "operator@test.com"
      );
      expect(updated.lifecycleStage).toBe("Production");
    });
  });

  describe("2. Event Immutability", () => {
    it("never overwrites existing events and preserves complete audit trail", async () => {
      const order = await createDirectOrder(workspaceId, {
        customerId,
        orderType: "manufacturing",
      });

      // Initial event exists
      expect(order.events.length).toBe(1);
      const initialEventId = order.events[0].id;

      // Add a human edit event
      const afterEdit = await applyHumanOrderAction(workspaceId, order.id, {
        action: "edit",
        field: "quantity",
        newValue: 500,
        unit: "units",
        actorEmail: "lead@test.com",
        note: "Customer confirmed 500 units over call",
      });

      expect(afterEdit.events.length).toBe(2);
      expect(afterEdit.events[0].id).toBe(initialEventId);
      expect(afterEdit.events[1].field).toBe("quantity");
      expect(afterEdit.events[1].actor).toBe("human");

      // Add another edit to the same field
      const afterSecondEdit = await applyHumanOrderAction(workspaceId, order.id, {
        action: "edit",
        field: "quantity",
        newValue: 1000,
        unit: "units",
        actorEmail: "lead@test.com",
        note: "Customer bumped quantity to 1000 units",
      });

      expect(afterSecondEdit.events.length).toBe(3);
      // Previous event value is preserved in history
      expect(afterSecondEdit.events[1].newValue).toBe(500);
      expect(afterSecondEdit.events[2].newValue).toBe(1000);
      expect(afterSecondEdit.reducedState.fields["quantity"]?.value).toBe(1000);
    });
  });

  describe("3. Order Type & Dynamic Required Fields", () => {
    it("dynamically changes required field sets when switching order types", async () => {
      const order = await createDirectOrder(workspaceId, {
        customerId,
        orderType: "consultation",
      });

      expect(order.orderType).toBe("consultation");
      // Consultation requires consultationTier, duration, scheduledDate
      expect(order.reducedState.fields["consultation_tier"]).toBeDefined();
      expect(order.reducedState.fields["duration"]).toBeDefined();
      expect(order.reducedState.fields["scheduled_date"]).toBeDefined();

      // Switch to Design
      const designOrder = await updateOrderType(workspaceId, order.id, "design");
      expect(designOrder.orderType).toBe("design");
      expect(designOrder.reducedState.fields["design_tier"]).toBeDefined();
      expect(designOrder.reducedState.fields["sku_name"]).toBeDefined();
      expect(designOrder.reducedState.fields["concepts_count"]).toBeDefined();

      // Switch to Manufacturing
      const mfgOrder = await updateOrderType(workspaceId, order.id, "manufacturing");
      expect(mfgOrder.orderType).toBe("manufacturing");
      expect(mfgOrder.reducedState.fields["product_type"]).toBeDefined();
      expect(mfgOrder.reducedState.fields["quantity"]).toBeDefined();
      expect(mfgOrder.reducedState.fields["material"]).toBeDefined();
      expect(mfgOrder.reducedState.fields["finish"]).toBeDefined();
    });
  });

  describe("4. Manual Pricing & Manufacturing Quote Handling", () => {
    it("calculates quote total deterministically and supports status updates with no AI hallucinated prices", async () => {
      const order = await createDirectOrder(workspaceId, {
        customerId,
        orderType: "manufacturing",
      });

      const total = calculateQuoteTotal(
        [
          { id: "1", description: "Rigid Box Outer", quantity: 500, unitPriceINR: 80, totalINR: 40000 },
          { id: "2", description: "EVA Foam Flocked Tray", quantity: 500, unitPriceINR: 25, totalINR: 12500 },
        ],
        8000,  // Material cost
        4500,  // Finish cost
        2000   // Accessories cost
      );

      expect(total).toBe(40000 + 12500 + 8000 + 4500 + 2000); // 67000

      const savedQuote = await upsertOrderQuote(workspaceId, order.id, {
        status: "Draft",
        lineItems: [
          { id: "1", description: "Rigid Box Outer", quantity: 500, unitPriceINR: 80, totalINR: 40000 },
          { id: "2", description: "EVA Foam Flocked Tray", quantity: 500, unitPriceINR: 25, totalINR: 12500 },
        ],
        materialCostINR: 8000,
        finishCostINR: 4500,
        accessoriesCostINR: 2000,
        notes: "Based on 350 GSM White SBS + Gold Foil Die #841",
      });

      expect(savedQuote.totalINR).toBe(67000);
      expect(savedQuote.status).toBe("Draft");

      // Verify listOrders includes value display
      const list = await listOrders(workspaceId);
      const listItem = list.find((o) => o.id === order.id);
      expect(listItem?.valueDisplay).toBe("₹67,000");

      // Update quote status to Sent
      const sentQuote = await upsertOrderQuote(workspaceId, order.id, {
        status: "Sent",
      });
      expect(sentQuote.status).toBe("Sent");
    });
  });

  describe("5. Production Brief Gate", () => {
    it("blocks brief generation when order is unconfirmed and generates brief once all required fields confirmed", async () => {
      const order = await createDirectOrder(workspaceId, {
        customerId,
        orderType: "manufacturing",
      });

      // Status is DRAFT -> blocked!
      await expect(generateProductionBrief(workspaceId, order.id)).rejects.toThrow(
        /Cannot generate production brief: order status is/
      );

      // Confirm all required manufacturing fields
      const reqFields = [
        { field: "product_type", val: "Rigid Magnetic Box" },
        { field: "quantity", val: 500 },
        { field: "dimensions", val: "180x120x60 mm" },
        { field: "material", val: "350 GSM White SBS Board" },
        { field: "finish", val: "Matte Lamination + Gold Foil" },
        { field: "printing", val: "CMYK Outer Full Color" },
        { field: "deadline", val: "2026-11-15" },
      ];

      for (const item of reqFields) {
        await applyHumanOrderAction(workspaceId, order.id, {
          action: "edit",
          field: item.field,
          newValue: item.val,
          actorEmail: "estimator@test.com",
        });
      }

      const confirmedOrder = await getOrderDetails(workspaceId, order.id);
      expect(confirmedOrder?.status).toBe("CONFIRMED");

      // Now brief generation succeeds!
      const brief = await generateProductionBrief(workspaceId, order.id);
      expect(brief).toBeDefined();
      expect(brief.content.productType).toBe("Rigid Magnetic Box");
      expect(brief.content.quantity).toBe(500);
      expect(brief.content.material).toBe("350 GSM White SBS Board");
      expect(brief.content.footer).toContain("confirmed version");
    });
  });
});
