import { getDb } from "@/server/db/mongodb";
import { ObjectId } from "mongodb";
import {
  Note,
  TaskScheduleEvent,
  OrderDoc,
  Customer,
  CompanyBrain,
  Conversation,
  ExtractedEvent,
  REQUIRED_FIELDS_BY_ORDER_TYPE,
  OrderType,
} from "@/server/db/schema";
import { listTasks } from "./notesTasks.service";
import { listNotes } from "./notesTasks.service";

export interface TodayStripItem {
  id: string;
  type: "deadline" | "followup" | "approval" | "payment" | "consultation" | "production";
  title: string;
  dueAt: Date;
  done: boolean;
  orderId?: string;
  clientId?: string;
  clientName?: string;
  orderNumber?: string;
}

export interface TodayStripData {
  deadlinesCount: number;
  followupsCount: number;
  approvalsCount: number;
  paymentsCount: number;
  consultationsCount: number;
  totalToday: number;
  items: TodayStripItem[];
}

export interface UrgentAttentionItem {
  id: string;
  orderId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  orderType: string;
  lifecycleStage: string;
  urgencyLevel: "critical" | "high" | "medium";
  urgencyScore: number;
  reasonType: "overdue" | "conflict" | "missing_info" | "out_of_scope" | "awaiting_approval" | "awaiting_advance";
  title: string;
  description: string;
  deadline?: string;
  daysStale?: number;
  actionUrl: string;
  actionLabel: string;
}

export interface PipelineStats {
  byStage: Record<string, number>;
  byType: Record<string, number>;
  totalActive: number;
  totalConfirmed: number;
  totalDelivered: number;
  totalEstimatedValueINR: number;
}

export interface ActiveClientFeedItem {
  clientId: string;
  clientName: string;
  company?: string;
  lastMessageContent: string;
  lastMessageAt: Date;
  unprocessedDumpsCount: number;
  activeOrdersCount: number;
  conversationId?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  ctaText: string;
}

export interface OnboardingChecklistData {
  isAllCompleted: boolean;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  steps: OnboardingStep[];
}

export interface WorkspaceDashboardData {
  todayStrip: TodayStripData;
  needsAttentionQueue: UrgentAttentionItem[];
  pipelineStats: PipelineStats;
  activeClientFeeds: ActiveClientFeedItem[];
  pinnedNotes: Array<Note & { id: string }>;
  onboardingChecklist: OnboardingChecklistData;
  upcomingEvents: Array<TaskScheduleEvent & { id: string }>;
}

export async function getWorkspaceDashboardData(workspaceId: string): Promise<WorkspaceDashboardData> {
  const db = await getDb();

  // Run database queries in parallel for high efficiency
  const [
    allTasks,
    allOrders,
    allClients,
    allConversations,
    allExtractedEvents,
    allNotes,
    companyBrain,
  ] = await Promise.all([
    db.collection<TaskScheduleEvent>("tasks").find({ workspaceId }).sort({ dueAt: 1 }).toArray(),
    db.collection<OrderDoc>("orders").find({ workspaceId }).sort({ updatedAt: -1 }).toArray(),
    db.collection<Customer>("customers").find({ workspaceId }).toArray(),
    db.collection<Conversation>("conversations").find({ workspaceId }).sort({ lastMessageAt: -1 }).toArray(),
    db.collection<ExtractedEvent>("extracted_events").find({ workspaceId }).toArray(),
    db.collection<Note>("notes").find({ workspaceId, pinned: true }).sort({ createdAt: -1 }).toArray(),
    db.collection<CompanyBrain>("company_brain").findOne({ workspaceId }),
  ]);

  const clientMap = new Map<string, Customer>();
  allClients.forEach((c) => {
    const id = c._id ? c._id.toString() : "";
    if (id) clientMap.set(id, c);
  });

  const orderMap = new Map<string, OrderDoc>();
  allOrders.forEach((o) => {
    const id = o._id ? o._id.toString() : "";
    if (id) orderMap.set(id, o);
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. TODAY STRIP
  const todayTasks = allTasks.filter((t) => {
    if (t.done) return false;
    const taskDue = new Date(t.dueAt);
    return taskDue <= endOfToday; // Due today or overdue
  });

  const todayStripItems: TodayStripItem[] = todayTasks.map((t) => {
    const order = t.orderId ? orderMap.get(t.orderId) : undefined;
    const client = t.clientId ? clientMap.get(t.clientId) : order?.customerId ? clientMap.get(order.customerId) : undefined;

    return {
      id: t._id ? t._id.toString() : "",
      type: t.type,
      title: t.title,
      dueAt: new Date(t.dueAt),
      done: t.done ?? false,
      orderId: t.orderId,
      clientId: t.clientId || order?.customerId,
      clientName: client?.name || "Client",
      orderNumber: order?.orderNumber,
    };
  });

  let deadlinesCount = 0;
  let followupsCount = 0;
  let approvalsCount = 0;
  let paymentsCount = 0;
  let consultationsCount = 0;

  todayStripItems.forEach((item) => {
    if (item.type === "deadline") deadlinesCount++;
    else if (item.type === "followup") followupsCount++;
    else if (item.type === "approval") approvalsCount++;
    else if (item.type === "payment") paymentsCount++;
    else if (item.type === "consultation") consultationsCount++;
  });

  const todayStrip: TodayStripData = {
    deadlinesCount,
    followupsCount,
    approvalsCount,
    paymentsCount,
    consultationsCount,
    totalToday: todayStripItems.length,
    items: todayStripItems,
  };

  // 2. NEEDS-ATTENTION QUEUE (Ranked by urgency)
  const needsAttentionQueue: UrgentAttentionItem[] = [];

  for (const order of allOrders) {
    if (order.lifecycleStage === "Delivered" || order.lifecycleStage === "Cancelled") {
      continue;
    }

    const client = clientMap.get(order.customerId);
    const clientName = client?.name || "Direct Customer";
    const orderId = order._id ? order._id.toString() : "";
    const orderNumber = order.orderNumber || "ORD-???";
    const fields = (order.currentFields || {}) as Record<string, any>;
    const orderType = (order.orderType || "manufacturing") as OrderType;
    const requiredKeys = REQUIRED_FIELDS_BY_ORDER_TYPE[orderType] || [];

    // Check 1: Overdue orders (deadline in past)
    if (fields.deadline?.value) {
      const deadlineDate = new Date(fields.deadline.value);
      if (!isNaN(deadlineDate.getTime()) && deadlineDate < startOfToday) {
        needsAttentionQueue.push({
          id: `overdue-${orderId}`,
          orderId,
          orderNumber,
          clientId: order.customerId,
          clientName,
          orderType,
          lifecycleStage: order.lifecycleStage,
          urgencyLevel: "critical",
          urgencyScore: 100,
          reasonType: "overdue",
          title: `Overdue Delivery Deadline`,
          description: `Delivery was promised for ${new Date(fields.deadline.value).toLocaleDateString()}. Action required immediately.`,
          deadline: String(fields.deadline.value),
          actionUrl: `/orders/${orderId}`,
          actionLabel: "View Order",
        });
      }
    }

    // Check 2: Conflicting fields
    const conflictingFields = Object.entries(fields)
      .filter(([_, f]) => f?.status === "CONFLICTING")
      .map(([k]) => k);

    if (conflictingFields.length > 0) {
      needsAttentionQueue.push({
        id: `conflict-${orderId}`,
        orderId,
        orderNumber,
        clientId: order.customerId,
        clientName,
        orderType,
        lifecycleStage: order.lifecycleStage,
        urgencyLevel: "critical",
        urgencyScore: 90,
        reasonType: "conflict",
        title: `Contradictory Specifications (${conflictingFields.join(", ")})`,
        description: `Customer chat contains conflicting values for ${conflictingFields.join(", ")}. Side-by-side human resolution needed.`,
        actionUrl: `/orders/${orderId}`,
        actionLabel: "Resolve Conflict",
      });
    }

    // Check 3: Missing info older than 2 days
    const missingFields = requiredKeys.filter((k) => !fields[k] || fields[k]?.status === "MISSING");
    const orderAgeDays = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    if (missingFields.length > 0 && orderAgeDays >= 2) {
      needsAttentionQueue.push({
        id: `missing-${orderId}`,
        orderId,
        orderNumber,
        clientId: order.customerId,
        clientName,
        orderType,
        lifecycleStage: order.lifecycleStage,
        urgencyLevel: "high",
        urgencyScore: 70 + Math.min(orderAgeDays, 15),
        reasonType: "missing_info",
        title: `Unresolved Missing Specs (${missingFields.slice(0, 3).join(", ")})`,
        description: `Stale for ${orderAgeDays} days. Awaiting customer reply on essential packaging specifications.`,
        daysStale: orderAgeDays,
        actionUrl: `/orders/${orderId}`,
        actionLabel: "Copy Clarification",
      });
    }

    // Check 4: Awaiting Design Approval (Stage Gate)
    if (order.lifecycleStage === "Design") {
      needsAttentionQueue.push({
        id: `approval-${orderId}`,
        orderId,
        orderNumber,
        clientId: order.customerId,
        clientName,
        orderType,
        lifecycleStage: order.lifecycleStage,
        urgencyLevel: "high",
        urgencyScore: 60,
        reasonType: "awaiting_approval",
        title: `Client Design Approval Pending`,
        description: `Artwork dielines sent. Record client approval once confirmed to unlock advance invoice.`,
        actionUrl: `/orders/${orderId}`,
        actionLabel: "Record Approval",
      });
    }

    // Check 5: Awaiting Advance Payment (Stage Gate)
    if (order.lifecycleStage === "Design approved") {
      needsAttentionQueue.push({
        id: `advance-${orderId}`,
        orderId,
        orderNumber,
        clientId: order.customerId,
        clientName,
        orderType,
        lifecycleStage: order.lifecycleStage,
        urgencyLevel: "medium",
        urgencyScore: 50,
        reasonType: "awaiting_advance",
        title: `Advance Deposit Pending`,
        description: `Design approved. Awaiting advance token payment before moving to plate setup and production.`,
        actionUrl: `/orders/${orderId}`,
        actionLabel: "Record Advance",
      });
    }
  }

  // Sort queue by urgencyScore descending
  needsAttentionQueue.sort((a, b) => b.urgencyScore - a.urgencyScore);

  // 3. ORDER PIPELINE STATS
  const byStage: Record<string, number> = {
    Enquiry: 0,
    Consultation: 0,
    Design: 0,
    "Design approved": 0,
    "Advance paid": 0,
    Sample: 0,
    Production: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  const byType: Record<string, number> = {
    consultation: 0,
    design: 0,
    manufacturing: 0,
  };

  let totalActive = 0;
  let totalConfirmed = 0;
  let totalDelivered = 0;

  for (const o of allOrders) {
    const stage = o.lifecycleStage || "Enquiry";
    if (byStage[stage] !== undefined) {
      byStage[stage]++;
    } else {
      byStage[stage] = 1;
    }

    const type = o.orderType || "manufacturing";
    if (byType[type] !== undefined) {
      byType[type]++;
    }

    if (stage !== "Delivered" && stage !== "Cancelled") {
      totalActive++;
    }
    if (o.status === "CONFIRMED") {
      totalConfirmed++;
    }
    if (stage === "Delivered") {
      totalDelivered++;
    }
  }

  // Calculate estimated total pipeline value from company brain and orders
  let totalEstimatedValueINR = 0;
  for (const o of allOrders) {
    if (o.lifecycleStage === "Delivered" || o.lifecycleStage === "Cancelled") continue;
    if (o.orderType === "consultation") {
      totalEstimatedValueINR += 2000;
    } else if (o.orderType === "design") {
      totalEstimatedValueINR += 8000;
    } else {
      // Manufacturing base estimation (default 25000 if not quoted)
      totalEstimatedValueINR += 25000;
    }
  }

  const pipelineStats: PipelineStats = {
    byStage,
    byType,
    totalActive,
    totalConfirmed,
    totalDelivered,
    totalEstimatedValueINR,
  };

  // 4. ACTIVE CLIENT FEEDS
  const activeClientFeeds: ActiveClientFeedItem[] = [];

  for (const client of allClients) {
    const cId = client._id ? client._id.toString() : "";
    const clientConvs = allConversations.filter((c) => c.customerId === cId);
    if (clientConvs.length === 0) continue;

    const mostRecentConv = clientConvs[0];
    const clientOrders = allOrders.filter(
      (o) => o.customerId === cId && o.lifecycleStage !== "Delivered" && o.lifecycleStage !== "Cancelled"
    );

    // Unprocessed dumps count = conversations where extracted_events count is 0
    const unprocessedDumps = clientConvs.filter((conv) => {
      const convId = conv._id ? conv._id.toString() : "";
      const hasEvents = allExtractedEvents.some((e) => e.conversationId === convId);
      return !hasEvents;
    }).length;

    activeClientFeeds.push({
      clientId: cId,
      clientName: client.name,
      company: client.company,
      lastMessageContent: mostRecentConv.lastMessagePreview || "Export ingested",
      lastMessageAt: new Date(mostRecentConv.lastMessageAt || mostRecentConv.createdAt),
      unprocessedDumpsCount: unprocessedDumps,
      activeOrdersCount: clientOrders.length,
      conversationId: mostRecentConv._id ? mostRecentConv._id.toString() : undefined,
    });
  }

  activeClientFeeds.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  // 5. PINNED NOTES
  const pinnedNotes = allNotes.map((n) => ({
    ...n,
    id: n._id ? n._id.toString() : "",
  }));

  // 6. ONBOARDING CHECKLIST
  const hasBrainConfigured = Boolean(
    companyBrain &&
    companyBrain.services?.length > 0 &&
    companyBrain.materials?.length > 0
  );
  const hasClients = allClients.length > 0;
  const hasConversations = allConversations.length > 0;
  const hasProcessedEvents = allExtractedEvents.length > 0;
  const hasOrders = allOrders.length > 0;

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "company_brain",
      title: "Configure Company Brain",
      description: "Define substrate catalogs, pricing tables, finishes, and out-of-scope rules.",
      completed: hasBrainConfigured,
      href: "/settings",
      ctaText: "Review Brain",
    },
    {
      id: "first_client",
      title: "Add your First Packaging Client",
      description: "Create customer profile with contact information and brand associations.",
      completed: hasClients,
      href: "/customers",
      ctaText: "Add Client",
    },
    {
      id: "first_dump",
      title: "Import WhatsApp / Audio Dump",
      description: "Paste a messy customer chat or drop dieline artwork and voice notes.",
      completed: hasConversations,
      href: "/inbox",
      ctaText: "Import Chat",
    },
    {
      id: "process_dump",
      title: "Process Conversation with AI Pipeline",
      description: "Run deterministic Gemma extraction to extract verified specifications and quotes.",
      completed: hasProcessedEvents,
      href: "/inbox",
      ctaText: "Open Inbox",
    },
    {
      id: "review_order",
      title: "Review & Confirm First Order",
      description: "Inspect four states of truth, confirm inferred values, and generate production brief.",
      completed: hasOrders,
      href: "/orders",
      ctaText: "Order Matrix",
    },
  ];

  const completedCount = onboardingSteps.filter((s) => s.completed).length;
  const totalCount = onboardingSteps.length;
  const isAllCompleted = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const onboardingChecklist: OnboardingChecklistData = {
    isAllCompleted,
    completedCount,
    totalCount,
    progressPercent,
    steps: onboardingSteps,
  };

  // 7. UPCOMING SCHEDULE EVENTS (for calendar/schedule widget)
  const upcomingEvents = allTasks.map((t) => ({
    ...t,
    id: t._id ? t._id.toString() : "",
  }));

  return {
    todayStrip,
    needsAttentionQueue,
    pipelineStats,
    activeClientFeeds: activeClientFeeds.slice(0, 10),
    pinnedNotes,
    onboardingChecklist,
    upcomingEvents,
  };
}
