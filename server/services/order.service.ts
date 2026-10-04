import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import type {
  OrderDoc,
  OrderEventDoc,
  OrderVersionDoc,
  OrderQuoteDoc,
  ExtractedEvent,
  OrderStatus,
  OrderType,
  OrderLifecycleStage,
  Customer,
  Brand,
  ClarificationDoc,
  TaskScheduleEvent,
} from "@/server/db/schema";
import { REQUIRED_FIELDS_BY_ORDER_TYPE } from "@/server/db/schema";
import { replayOrderEvents, type ReducedOrderState } from "./orderReducer";
import { detectOrderChanges, type OrderChangeItem } from "./changeDetector";
import { detectOrderConflicts, type DetectedConflict } from "./conflictDetector";
import { detectAndCreateClarifications, listOrderClarifications } from "./missingDetector";
import { draftSuggestedMemoriesForConfirmedOrder } from "./customerMemory.service";
import { getOrderQuote } from "./orderQuote.service";

export interface OrderWithDetails extends OrderDoc {
  id: string;
  customer?: Customer & { id: string };
  brand?: Brand & { id: string };
  quote?: (OrderQuoteDoc & { id: string }) | null;
  deadlineEvent?: (TaskScheduleEvent & { id: string }) | null;
  attachments?: Array<{ id: string; filename: string; contentType: string; size: number; url: string }>;
  reducedState: ReducedOrderState;
  events: Array<OrderEventDoc & { id: string }>;
  versions: Array<OrderVersionDoc & { id: string }>;
  changes: OrderChangeItem[];
  clarifications: Array<ClarificationDoc & { id: string }>;
  conflicts: Record<string, DetectedConflict>;
}

/**
 * Finds or creates an Order for a given conversation.
 */
export async function getOrCreateOrderForConversation(
  workspaceId: string,
  conversationId: string,
  customerId: string,
  orderType: OrderType = "manufacturing"
): Promise<OrderDoc & { id: string }> {
  const db = await getDb();

  const existing = await db.collection<OrderDoc>("orders").findOne({
    workspaceId,
    conversationId,
  });

  if (existing) {
    return {
      ...existing,
      id: existing._id!.toString(),
    };
  }

  // Generate unique order number
  const count = await db.collection("orders").countDocuments({ workspaceId });
  const orderNumber = `ORD-${String(count + 101).padStart(4, "0")}`;

  const newOrderDoc = {
    workspaceId,
    customerId,
    conversationId,
    orderNumber,
    orderType,
    lifecycleStage: "Enquiry" as OrderLifecycleStage,
    status: "DRAFT" as OrderStatus,
    currentFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await db.collection("orders").insertOne(newOrderDoc);
  return {
    ...newOrderDoc,
    id: res.insertedId.toString(),
  };
}

/**
 * Converts extracted AI events into immutable order events.
 * Idempotently merges new events, runs conflict detection, and recalculates order state using the deterministic reducer.
 */
export async function syncExtractedEventsToOrder(
  workspaceId: string,
  conversationId: string,
  customerId: string,
  extractedEvents: ExtractedEvent[]
): Promise<OrderWithDetails> {
  const db = await getDb();
  const order = await getOrCreateOrderForConversation(workspaceId, conversationId, customerId);

  // Fetch existing order events
  const existingOrderEvents = await db
    .collection<OrderEventDoc>("order_events")
    .find({ workspaceId, orderId: order.id })
    .toArray();

  const existingSourceKeys = new Set(
    existingOrderEvents.map(
      (oe) => `${oe.field}:${oe.source?.messageId}:${oe.newValue}`
    )
  );

  const newOrderEvents: OrderEventDoc[] = [];

  for (const ext of extractedEvents) {
    const key = `${ext.field}:${ext.messageId}:${ext.value}`;
    if (existingSourceKeys.has(key)) {
      continue; // Skip already converted event
    }

    // Rules from Phase 5+6:
    // op=set with explicit value -> CONFIRMED candidate
    // op=delta/ref -> INFERRED until human confirms
    const status = ext.op === "set" ? ("CONFIRMED" as const) : ("INFERRED" as const);
    const confirmation = ext.op === "set" ? ("confirmed" as const) : ("pending" as const);

    const doc: OrderEventDoc = {
      workspaceId,
      orderId: order.id,
      timestamp: ext.createdAt || new Date(),
      field: ext.field,
      newValue: ext.value,
      unit: ext.unit,
      status,
      source: {
        messageId: ext.messageId,
        quote: ext.quote,
      },
      actor: "ai" as const,
      confirmation,
      note: ext.rawPhrase ? `Extracted via Gemma (${ext.op}: ${ext.rawPhrase})` : "Extracted via Gemma",
      createdAt: new Date(),
    };

    newOrderEvents.push(doc);
  }

  if (newOrderEvents.length > 0) {
    await db.collection("order_events").insertMany(newOrderEvents);
  }

  // Fetch all events for this order
  const allEvents = await db
    .collection<OrderEventDoc>("order_events")
    .find({ workspaceId, orderId: order.id })
    .toArray();

  // Fetch historical orders for this customer (excluding this order)
  let orderObjectId: ObjectId | undefined;
  try {
    orderObjectId = new ObjectId(order.id);
  } catch {
    //
  }

  const histQuery: Record<string, unknown> = {
    workspaceId,
    customerId,
  };
  if (orderObjectId) {
    histQuery._id = { $ne: orderObjectId };
  }

  const historicalDocs = await db.collection<OrderDoc>("orders").find(histQuery).toArray();
  const historicalOrders = historicalDocs.map((h) => ({
    orderNumber: h.orderNumber,
    currentFields: h.currentFields,
  }));

  // Detect conflicts deterministically
  const conflicts = await detectOrderConflicts(allEvents, historicalOrders);

  // Replay all events through pure orderReducer with detected conflicts
  const reduced = replayOrderEvents(allEvents, conflicts, order.orderType || "manufacturing");

  // Check customer name and auto-create clarifications for missing required fields
  const custQuery: Record<string, unknown> = { workspaceId };
  if (/^[0-9a-fA-F]{24}$/.test(customerId)) {
    custQuery.$or = [{ _id: new ObjectId(customerId) }, { id: customerId }, { customId: customerId }];
  } else {
    custQuery.$or = [{ id: customerId }, { customId: customerId }, { name: customerId }];
  }
  const custDoc = await db.collection<Customer>("customers").findOne(custQuery);

  if (reduced.missingFields.length > 0) {
    await detectAndCreateClarifications(
      workspaceId,
      order.id,
      custDoc?.name || "Customer",
      reduced.missingFields
    );
  }

  // Update order document
  await db.collection("orders").updateOne(
    { _id: new ObjectId(order.id), workspaceId },
    {
      $set: {
        status: reduced.overallStatus,
        currentFields: reduced.fields,
        updatedAt: new Date(),
      },
    }
  );

  return getOrderDetails(workspaceId, order.id) as Promise<OrderWithDetails>;
}

/**
 * Retrieves order details, customer, timeline events, replayed specs,
 * what-changed audit diffs, active clarifications, and conflicts.
 */
export async function getOrderDetails(
  workspaceId: string,
  orderId: string
): Promise<OrderWithDetails | null> {
  const db = await getDb();
  let orderDoc = null;
  try {
    orderDoc = await db.collection<OrderDoc>("orders").findOne({
      _id: new ObjectId(orderId),
      workspaceId,
    });
  } catch {
    // Ignore invalid ObjectId and fallback to alternative identifiers
  }

  if (!orderDoc) {
    orderDoc = await db.collection<OrderDoc>("orders").findOne({
      workspaceId,
      $or: [
        { orderNumber: orderId },
        { id: orderId } as any,
        { conversationId: orderId },
      ],
    });
  }

  if (!orderDoc) {
    // Generic slug/token resolution for customer or order slugs (e.g. ord_client_brief)
    const tokens = orderId
      .replace(/^ord_/, "")
      .split(/[_-]+/)
      .filter((t) => t.length > 2);

    if (tokens.length > 0) {
      const regexPatterns = tokens.map((t) => new RegExp(t, "i"));
      const matchedCust = await db.collection<Customer>("customers").findOne({
        workspaceId,
        $or: [
          ...regexPatterns.map((r) => ({ name: { $regex: r } })),
          ...regexPatterns.map((r) => ({ company: { $regex: r } })),
        ],
      });
      if (matchedCust) {
        const custId = matchedCust._id ? matchedCust._id.toString() : (matchedCust as any).id;
        orderDoc = await db.collection<OrderDoc>("orders").findOne(
          {
            workspaceId,
            customerId: custId,
          },
          { sort: { updatedAt: -1 } }
        );
      }
    }
  }

  // Fallback: If still not found, return the most recent order for this workspace so demo links never 404
  if (!orderDoc) {
    orderDoc = await db.collection<OrderDoc>("orders").findOne(
      { workspaceId },
      { sort: { updatedAt: -1 } }
    );
  }

  if (!orderDoc) return null;
  const canonicalOrderId = orderDoc._id ? orderDoc._id.toString() : orderId;

  const orderCustQuery: Record<string, unknown> = { workspaceId };
  if (/^[0-9a-fA-F]{24}$/.test(orderDoc.customerId)) {
    orderCustQuery.$or = [{ _id: new ObjectId(orderDoc.customerId) }, { id: orderDoc.customerId }];
  } else {
    orderCustQuery.$or = [{ id: orderDoc.customerId }, { customId: orderDoc.customerId }];
  }

  const orderBrandQuery: Record<string, unknown> = { workspaceId };
  if (orderDoc.brandId) {
    if (/^[0-9a-fA-F]{24}$/.test(orderDoc.brandId)) {
      orderBrandQuery.$or = [{ _id: new ObjectId(orderDoc.brandId) }, { id: orderDoc.brandId }];
    } else {
      orderBrandQuery.$or = [{ id: orderDoc.brandId }];
    }
  }

  const [customerDoc, eventDocs, versionDocs, clarificationDocs, brandDoc, quoteDoc, deadlineTask, attachmentDocs] =
    await Promise.all([
      db.collection<Customer>("customers").findOne(orderCustQuery),
      db.collection<OrderEventDoc>("order_events").find({ workspaceId, orderId: { $in: [orderId, canonicalOrderId] } }).sort({ timestamp: 1 }).toArray(),
      db.collection<OrderVersionDoc>("order_versions").find({ workspaceId, orderId: { $in: [orderId, canonicalOrderId] } }).sort({ versionNumber: -1 }).toArray(),
      listOrderClarifications(workspaceId, canonicalOrderId),
      orderDoc.brandId
        ? db.collection<Brand>("brands").findOne(orderBrandQuery)
        : Promise.resolve(null),
      getOrderQuote(workspaceId, canonicalOrderId),
      db.collection<TaskScheduleEvent>("tasks").findOne({ workspaceId, orderId: { $in: [orderId, canonicalOrderId] }, type: "deadline" }),
      db.collection("attachments").find({
        workspaceId,
        $or: [
          { orderId: { $in: [orderId, canonicalOrderId] } },
          ...(orderDoc.conversationId ? [{ conversationId: orderDoc.conversationId }] : []),
        ],
      }).sort({ uploadedAt: -1 }).toArray(),
    ]);

  // Fetch past orders for this customer (excluding this order)
  const historicalDocs = await db.collection<OrderDoc>("orders").find({
    workspaceId,
    customerId: orderDoc.customerId,
    _id: { $ne: orderDoc._id },
  }).toArray();


  const historicalOrders = historicalDocs.map((h) => ({
    orderNumber: h.orderNumber,
    currentFields: h.currentFields,
  }));

  // Detect conflicts and replay order state
  const conflicts = await detectOrderConflicts(eventDocs, historicalOrders);
  const reducedState = replayOrderEvents(eventDocs, conflicts, orderDoc.orderType || "manufacturing");

  // Generate plain-English What Changed timeline
  const changes = detectOrderChanges(eventDocs);

  // Also collect attachments attached to messages for this conversation
  const messageAtts: any[] = [];
  if (orderDoc.conversationId) {
    const msgsWithAtts = await db.collection("messages").find({
      workspaceId,
      conversationId: orderDoc.conversationId,
      "attachments.0": { $exists: true },
    }).toArray();
    for (const msg of msgsWithAtts) {
      for (const att of (msg as any).attachments || []) {
        messageAtts.push(att);
      }
    }
  }

  // Combine and deduplicate by id
  const attMap = new Map<string, any>();
  for (const a of attachmentDocs) {
    const id = a._id ? a._id.toString() : a.id;
    if (id) {
      attMap.set(id, {
        id,
        filename: a.filename || "Attachment",
        contentType: a.contentType || "application/octet-stream",
        size: a.size || 0,
        url: `/api/attachments/${id}`,
      });
    }
  }
  for (const a of messageAtts) {
    const id = a._id ? a._id.toString() : a.id;
    if (id && !attMap.has(id)) {
      attMap.set(id, {
        id,
        filename: a.filename || "Attachment",
        contentType: a.contentType || "application/octet-stream",
        size: a.size || 0,
        url: a.url || `/api/attachments/${id}`,
      });
    }
  }

  const attachments = Array.from(attMap.values());

  return {
    ...orderDoc,
    id: orderDoc._id!.toString(),
    customer: customerDoc ? { ...customerDoc, id: customerDoc._id!.toString() } : undefined,
    brand: brandDoc ? { ...brandDoc, id: brandDoc._id!.toString() } : undefined,
    quote: quoteDoc,
    deadlineEvent: deadlineTask ? { ...deadlineTask, id: deadlineTask._id!.toString() } : null,
    attachments,
    reducedState,
    events: eventDocs.map((e) => ({ ...e, id: e._id!.toString() })),
    versions: versionDocs.map((v) => ({ ...v, id: v._id!.toString() })),
    changes,
    clarifications: clarificationDocs,
    conflicts,
  };
}

export interface ListOrdersOptions {
  status?: string;
  type?: string;
  stage?: string;
  search?: string;
  clientId?: string;
  brandId?: string;
}

export interface OrderListItem extends OrderDoc {
  id: string;
  customerName: string;
  brandName?: string;
  fieldCount: number;
  fieldTruthSummary: {
    confirmed: number;
    inferred: number;
    missing: number;
    conflicting: number;
  };
  deadline?: string;
  valueDisplay: string;
  quote?: OrderQuoteDoc | null;
  lastActivity: string;
}

/**
 * Lists all orders scoped by workspace with full field truth, value, and brand data.
 */
export async function listOrders(
  workspaceId: string,
  optionsOrStatus?: string | ListOrdersOptions
): Promise<OrderListItem[]> {
  const db = await getDb();
  const options: ListOrdersOptions =
    typeof optionsOrStatus === "string"
      ? { status: optionsOrStatus }
      : optionsOrStatus || {};

  const query: Record<string, unknown> = { workspaceId };

  if (options.status && options.status !== "ALL") {
    query.status = options.status;
  }
  if (options.type && options.type !== "ALL") {
    query.orderType = options.type;
  }
  if (options.stage && options.stage !== "ALL") {
    query.lifecycleStage = options.stage;
  }
  if (options.clientId) {
    query.customerId = options.clientId;
  }
  if (options.brandId) {
    query.brandId = options.brandId;
  }
  if (options.search) {
    const s = options.search.trim();
    query.$or = [
      { orderNumber: { $regex: s, $options: "i" } },
      { "currentFields.product_type.value": { $regex: s, $options: "i" } },
      { "currentFields.productType.value": { $regex: s, $options: "i" } },
    ];
  }

  const orders = await db
    .collection<OrderDoc>("orders")
    .find(query)
    .sort({ updatedAt: -1 })
    .toArray();

  if (orders.length === 0) return [];

  // Batch fetch customers, brands, quotes, and deadlines
  const rawCustomerIds = Array.from(new Set(orders.map((o) => o.customerId).filter(Boolean)));
  const hexCustomerIds = rawCustomerIds.filter((id) => /^[0-9a-fA-F]{24}$/.test(id)).map((id) => new ObjectId(id));
  const strCustomerIds = rawCustomerIds;

  const rawBrandIds = Array.from(
    new Set(orders.map((o) => o.brandId).filter(Boolean) as string[])
  );
  const hexBrandIds = rawBrandIds.filter((id) => /^[0-9a-fA-F]{24}$/.test(id)).map((id) => new ObjectId(id));
  const strBrandIds = rawBrandIds;

  const orderIds = orders.map((o) => (o._id ? o._id.toString() : (o as any).id || ""));

  const [customerDocs, brandDocs, quoteDocs, taskDocs] = await Promise.all([
    rawCustomerIds.length > 0
      ? db.collection<Customer>("customers").find({
          workspaceId,
          $or: [
            ...(hexCustomerIds.length > 0 ? [{ _id: { $in: hexCustomerIds } }] : []),
            { id: { $in: strCustomerIds } },
            { customId: { $in: strCustomerIds } },
          ],
        }).toArray()
      : Promise.resolve([]),
    rawBrandIds.length > 0
      ? db.collection<Brand>("brands").find({
          workspaceId,
          $or: [
            ...(hexBrandIds.length > 0 ? [{ _id: { $in: hexBrandIds } }] : []),
            { id: { $in: strBrandIds } },
          ],
        }).toArray()
      : Promise.resolve([]),
    db.collection<OrderQuoteDoc>("order_quotes").find({ workspaceId, orderId: { $in: orderIds } }).toArray(),
    db.collection<TaskScheduleEvent>("tasks").find({ workspaceId, orderId: { $in: orderIds }, type: "deadline" }).toArray(),
  ]);

  const customerMap = new Map<string, string>();
  customerDocs.forEach((c) => {
    const name = c.name || c.company || "Client";
    if (c._id) customerMap.set(c._id.toString(), name);
    if ((c as any).id) customerMap.set((c as any).id, name);
  });

  const brandMap = new Map<string, string>();
  brandDocs.forEach((b) => {
    if (b._id) brandMap.set(b._id.toString(), b.name);
    if ((b as any).id) brandMap.set((b as any).id, b.name);
  });
  const quoteMap = new Map(quoteDocs.map((q) => [q.orderId, q]));
  const taskMap = new Map(taskDocs.map((t) => [t.orderId!, t]));

  return orders.map((o) => {
    const orderId = o._id!.toString();
    const quote = quoteMap.get(orderId);
    const deadlineTask = taskMap.get(orderId);

    // Compute field truth counts
    let confirmed = 0;
    let inferred = 0;
    let missing = 0;
    let conflicting = 0;

    const reqFields = REQUIRED_FIELDS_BY_ORDER_TYPE[o.orderType || "manufacturing"] || [];
    const fieldsObj = (o.currentFields || {}) as Record<string, { status?: string; value?: unknown }>;

    Object.values(fieldsObj).forEach((f) => {
      if (f.status === "CONFIRMED") confirmed++;
      else if (f.status === "INFERRED") inferred++;
      else if (f.status === "CONFLICTING") conflicting++;
    });

    // Check missing required fields
    reqFields.forEach((rf) => {
      const snake = rf.replace(/([A-Z])/g, "_$1").toLowerCase();
      if (!fieldsObj[rf] && !fieldsObj[snake]) {
        missing++;
      }
    });

    // Determine value display
    let valueDisplay = "Needs quote";
    if (o.orderType === "consultation") {
      valueDisplay = "₹2,000 (Fixed Fee)";
    } else if (o.orderType === "design") {
      valueDisplay = "₹8,000 (Fixed Fee)";
    } else if (quote && quote.totalINR > 0) {
      valueDisplay = `₹${quote.totalINR.toLocaleString("en-IN")}`;
    }

    // Determine deadline string
    let deadlineStr = "";
    if (fieldsObj["deadline"]?.value) {
      deadlineStr = String(fieldsObj["deadline"].value);
    } else if (deadlineTask?.dueAt) {
      deadlineStr = new Date(deadlineTask.dueAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    return {
      ...o,
      id: orderId,
      customerName: customerMap.get(o.customerId) || "Customer",
      brandName: o.brandId ? brandMap.get(o.brandId) : undefined,
      fieldCount: Object.keys(o.currentFields || {}).length,
      fieldTruthSummary: {
        confirmed,
        inferred,
        missing,
        conflicting,
      },
      deadline: deadlineStr || undefined,
      valueDisplay,
      quote: quote || null,
      lastActivity: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString(),
    };
  });
}

/**
 * Updates order type and re-evaluates required field sets.
 */
export async function updateOrderType(
  workspaceId: string,
  orderId: string,
  newType: OrderType
): Promise<OrderWithDetails> {
  const db = await getDb();
  let orderObjectId: ObjectId;
  try {
    orderObjectId = new ObjectId(orderId);
  } catch {
    throw new Error("Invalid order ID");
  }

  const orderDoc = await db.collection<OrderDoc>("orders").findOne({
    _id: orderObjectId,
    workspaceId,
  });

  if (!orderDoc) {
    throw new Error("Order not found or access denied");
  }

  const existingEvents = await db
    .collection<OrderEventDoc>("order_events")
    .find({ workspaceId, orderId })
    .sort({ timestamp: 1 })
    .toArray();

  const newReduced = replayOrderEvents(existingEvents, undefined, newType);

  await db.collection("orders").updateOne(
    { _id: orderObjectId, workspaceId },
    {
      $set: {
        orderType: newType,
        status: newReduced.overallStatus,
        currentFields: newReduced.fields,
        updatedAt: new Date(),
      },
    }
  );

  return (await getOrderDetails(workspaceId, orderId))!;
}

/**
 * Creates a direct order for a customer/brand without requiring an initial chat dump.
 */
export async function createDirectOrder(
  workspaceId: string,
  data: {
    customerId: string;
    brandId?: string;
    orderType?: OrderType;
    initialTitle?: string;
  }
): Promise<OrderWithDetails> {
  const db = await getDb();
  const count = await db.collection("orders").countDocuments({ workspaceId });
  const orderNumber = `ORD-${String(count + 101).padStart(4, "0")}`;
  const conversationId = `conv_direct_${Date.now()}`;

  const newDoc: OrderDoc = {
    workspaceId,
    customerId: data.customerId,
    brandId: data.brandId,
    conversationId,
    orderNumber,
    orderType: data.orderType || "manufacturing",
    lifecycleStage: "Enquiry",
    status: "DRAFT",
    currentFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await db.collection("orders").insertOne(newDoc);
  const orderId = res.insertedId.toString();

  const initEvent: OrderEventDoc = {
    workspaceId,
    orderId,
    timestamp: new Date(),
    field: "order_created",
    newValue: orderNumber,
    status: "CONFIRMED",
    source: {
      quote: `Order manually created by operator (${data.initialTitle || "Direct Order"})`,
    },
    actor: "human",
    confirmation: "confirmed",
    note: data.initialTitle ? `Created for: ${data.initialTitle}` : "Manual order creation",
    createdAt: new Date(),
  };

  await db.collection("order_events").insertOne(initEvent);

  const initialReduced = replayOrderEvents([initEvent], undefined, newDoc.orderType);
  await db.collection("orders").updateOne(
    { _id: res.insertedId, workspaceId },
    {
      $set: {
        status: initialReduced.overallStatus,
        currentFields: initialReduced.fields,
      },
    }
  );

  return (await getOrderDetails(workspaceId, orderId))!;
}

export interface HumanActionInput {
  field?: string;
  action: "confirm" | "edit" | "resolve_conflict" | "confirm_all";
  newValue?: unknown;
  unit?: string;
  note?: string;
  actorEmail?: string;
}

/**
 * Applies a human operator action (Confirm candidate, Edit field, Resolve conflict, or Confirm All).
 * Appends an immutable OrderEvent and updates snapshot if confirmed.
 */
export async function applyHumanOrderAction(
  workspaceId: string,
  orderId: string,
  input: HumanActionInput
): Promise<OrderWithDetails> {
  const db = await getDb();
  let orderObjectId: ObjectId;
  try {
    orderObjectId = new ObjectId(orderId);
  } catch {
    throw new Error("Invalid order ID");
  }

  const orderDoc = await db.collection<OrderDoc>("orders").findOne({
    _id: orderObjectId,
    workspaceId,
  });

  if (!orderDoc) {
    throw new Error("Order not found or access denied");
  }

  // Get current events
  const existingEvents = await db
    .collection<OrderEventDoc>("order_events")
    .find({ workspaceId, orderId })
    .sort({ timestamp: 1 })
    .toArray();

  // If action is "confirm_all"
  if (input.action === "confirm_all") {
    const currentReduction = replayOrderEvents(existingEvents, undefined, orderDoc.orderType || "manufacturing");
    if (
      currentReduction.missingFields.length > 0 ||
      currentReduction.inferredCount > 0 ||
      currentReduction.conflictingCount > 0
    ) {
      throw new Error(
        `Cannot confirm order: ${currentReduction.missingFields.length} missing, ${currentReduction.inferredCount} unconfirmed, and ${currentReduction.conflictingCount} conflicting fields remain.`
      );
    }

    // Append confirm_all event
    const confirmAllEvent: OrderEventDoc = {
      workspaceId,
      orderId,
      timestamp: new Date(),
      field: "order_confirmation",
      newValue: "CONFIRMED",
      status: "CONFIRMED",
      source: {
        quote: `Final order locked and confirmed by operator (${input.actorEmail || "Operator"})`,
      },
      actor: "human",
      confirmation: "confirmed",
      note: input.note || "All specifications verified and locked for production",
      createdAt: new Date(),
    };

    await db.collection("order_events").insertOne(confirmAllEvent);

    const versionCount = await db
      .collection("order_versions")
      .countDocuments({ workspaceId, orderId });

    await db.collection("order_versions").insertOne({
      workspaceId,
      orderId,
      versionNumber: versionCount + 1,
      snapshot: currentReduction.fields,
      confirmedBy: input.actorEmail || "Operator",
      createdAt: new Date(),
    });

    await db.collection("orders").updateOne(
      { _id: orderObjectId, workspaceId },
      {
        $set: {
          status: "CONFIRMED",
          updatedAt: new Date(),
        },
      }
    );

    // Draft suggested customer memories (unverified by default per Phase 5b rule)
    await draftSuggestedMemoriesForConfirmedOrder(workspaceId, orderId).catch((err) => {
      console.warn("Failed to draft suggested memories for confirmed order:", err);
    });

    return (await getOrderDetails(workspaceId, orderId))!;
  }

  if (!input.field) {
    throw new Error("Field name is required for field-level actions");
  }

  const currentReduction = replayOrderEvents(existingEvents);
  const currentField = currentReduction.fields[input.field];

  let resolvedNewValue = input.newValue;
  if (input.action === "confirm" && (resolvedNewValue === undefined || resolvedNewValue === null)) {
    resolvedNewValue = currentField?.value;
  }

  let note = input.note;
  if (!note) {
    if (input.action === "confirm") note = "Confirmed specification";
    else if (input.action === "resolve_conflict") note = "Resolved spec conflict";
    else note = "Manually edited specification";
  }

  const humanEvent: OrderEventDoc = {
    workspaceId,
    orderId,
    timestamp: new Date(),
    field: input.field,
    previousValue: currentField?.value,
    newValue: resolvedNewValue,
    unit: input.unit || currentField?.unit,
    status: "CONFIRMED",
    source: {
      quote: `Verified by human operator (${input.actorEmail || "Operator"})`,
    },
    actor: "human",
    confirmation: "confirmed",
    note,
    createdAt: new Date(),
  };

  await db.collection("order_events").insertOne(humanEvent);

  // Replay all events
  const updatedEvents = [...existingEvents, humanEvent];
  const newReduced = replayOrderEvents(updatedEvents, undefined, orderDoc.orderType || "manufacturing");

  // If order status just flipped to CONFIRMED, create a version snapshot
  if (newReduced.overallStatus === "CONFIRMED") {
    const versionCount = await db
      .collection("order_versions")
      .countDocuments({ workspaceId, orderId });

    await db.collection("order_versions").insertOne({
      workspaceId,
      orderId,
      versionNumber: versionCount + 1,
      snapshot: newReduced.fields,
      confirmedBy: input.actorEmail || "Operator",
      createdAt: new Date(),
    });
  }

  // Update order record
  await db.collection("orders").updateOne(
    { _id: orderObjectId, workspaceId },
    {
      $set: {
        status: newReduced.overallStatus,
        currentFields: newReduced.fields,
        updatedAt: new Date(),
      },
    }
  );

  return (await getOrderDetails(workspaceId, orderId))!;
}

/**
 * Transitions order lifecycle stage with strict server-side stage-gate enforcement:
 * Cannot enter "Production" unless BOTH "Design approved" and "Advance paid" human events are recorded.
 */
export async function transitionLifecycleStage(
  workspaceId: string,
  orderId: string,
  newStage: OrderLifecycleStage,
  actorEmail: string = "Operator",
  note?: string
): Promise<OrderWithDetails> {
  const db = await getDb();
  let orderObjectId: ObjectId;
  try {
    orderObjectId = new ObjectId(orderId);
  } catch {
    throw new Error("Invalid order ID");
  }

  const orderDoc = await db.collection<OrderDoc>("orders").findOne({
    _id: orderObjectId,
    workspaceId,
  });

  if (!orderDoc) {
    throw new Error("Order not found or access denied");
  }

  // Fetch all order events for this order
  const events = await db
    .collection<OrderEventDoc>("order_events")
    .find({ workspaceId, orderId })
    .toArray();

  // Stage gate for Production:
  // Cannot enter Production unless BOTH "Design approved" and "Advance paid" human events are recorded
  if (newStage === "Production") {
    const hasDesignApproved = events.some(
      (e) =>
        e.actor === "human" &&
        (e.field === "stage_gate:design_approved" ||
          e.field === "design_approved" ||
          (e.field === "stage" && String(e.newValue).toLowerCase() === "design approved") ||
          (e.note && e.note.toLowerCase().includes("design approved")))
    );

    const hasAdvancePaid = events.some(
      (e) =>
        e.actor === "human" &&
        (e.field === "stage_gate:advance_paid" ||
          e.field === "advance_paid" ||
          (e.field === "stage" && String(e.newValue).toLowerCase() === "advance paid") ||
          (e.note && e.note.toLowerCase().includes("advance paid")))
    );

    if (!hasDesignApproved || !hasAdvancePaid) {
      const missingGates: string[] = [];
      if (!hasDesignApproved) missingGates.push("Design approved");
      if (!hasAdvancePaid) missingGates.push("Advance paid");
      throw new Error(
        `Stage-gate failure: Cannot enter Production without verified human events for: ${missingGates.join(", ")}.`
      );
    }
  }

  // Record stage transition as an immutable order event
  const stageEvent: OrderEventDoc = {
    workspaceId,
    orderId,
    timestamp: new Date(),
    field: "lifecycle_stage",
    previousValue: orderDoc.lifecycleStage || "Enquiry",
    newValue: newStage,
    status: "CONFIRMED",
    source: {
      quote: `Stage transitioned to ${newStage} by ${actorEmail}`,
    },
    actor: "human",
    confirmation: "confirmed",
    note: note || `Lifecycle stage updated to ${newStage}`,
    createdAt: new Date(),
  };

  await db.collection("order_events").insertOne(stageEvent);

  await db.collection("orders").updateOne(
    { _id: orderObjectId, workspaceId },
    {
      $set: {
        lifecycleStage: newStage,
        updatedAt: new Date(),
      },
    }
  );

  return (await getOrderDetails(workspaceId, orderId))!;
}

/**
 * Records a verified human stage-gate approval event (Design approved or Advance paid).
 */
export async function recordStageGateApproval(
  workspaceId: string,
  orderId: string,
  gate: "design_approved" | "advance_paid",
  actorEmail: string = "Operator",
  note?: string
): Promise<OrderWithDetails> {
  const db = await getDb();
  let orderObjectId: ObjectId;
  try {
    orderObjectId = new ObjectId(orderId);
  } catch {
    throw new Error("Invalid order ID");
  }

  const orderDoc = await db.collection<OrderDoc>("orders").findOne({
    _id: orderObjectId,
    workspaceId,
  });

  if (!orderDoc) {
    throw new Error("Order not found or access denied");
  }

  const gateLabel = gate === "design_approved" ? "Design approved" : "Advance paid";
  const gateField = `stage_gate:${gate}`;

  const gateEvent: OrderEventDoc = {
    workspaceId,
    orderId,
    timestamp: new Date(),
    field: gateField,
    newValue: true,
    status: "CONFIRMED",
    source: {
      quote: `Stage gate verified: ${gateLabel} by ${actorEmail}`,
    },
    actor: "human",
    confirmation: "confirmed",
    note: note || `${gateLabel} verified by human operator`,
    createdAt: new Date(),
  };

  await db.collection("order_events").insertOne(gateEvent);

  return (await getOrderDetails(workspaceId, orderId))!;
}
