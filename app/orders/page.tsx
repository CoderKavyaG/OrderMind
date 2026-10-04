"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StatTile } from "@/components/ui-ordermind/StatTile";
import { StatusChip } from "@/components/ui-ordermind/StatusChip";
import {
  Package,
  Plus,
  Clock,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  Filter,
  Check,
  Sparkle,
  ArrowRight,
  Building2,
  Tag,
  CheckSquare,
  Square,
  Trash2,
  ExternalLink,
  DollarSign,
  AlertCircle,
  X,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OrderStatus, OrderType, OrderLifecycleStage } from "@/server/db/schema";
import type { OrderListItem } from "@/server/services/order.service";

const LIFECYCLE_STAGES: OrderLifecycleStage[] = [
  "Enquiry",
  "Consultation",
  "Design",
  "Design approved",
  "Advance paid",
  "Sample",
  "Production",
  "Delivered",
  "Cancelled",
];

const ORDER_TYPES: { id: OrderType; label: string; color: string }[] = [
  { id: "manufacturing", label: "Manufacturing", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "design", label: "Design", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "consultation", label: "Consultation", color: "bg-blue-100 text-blue-800 border-blue-300" },
];

export default function OrderMatrixPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono">Loading Orders...</div>}>
      <OrderMatrixContent />
    </Suspense>
  );
}

function OrderMatrixContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const initialClientId = searchParams.get("clientId");
  const actionParam = searchParams.get("action");

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "board">("table");

  // Filters & Saved Views
  const [activeTab, setActiveTab] = useState<"ALL" | "NEEDS_REVIEW" | "PRODUCTION" | "DELIVERED">(
    initialStatus === "CONFIRMED"
      ? "PRODUCTION"
      : initialStatus === "NEEDS_REVIEW"
      ? "NEEDS_REVIEW"
      : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [selectedClient, setSelectedClient] = useState<string>(initialClientId || "ALL");

  // Bulk actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkStageModal, setBulkStageModal] = useState(false);
  const [bulkStageTarget, setBulkStageTarget] = useState<OrderLifecycleStage>("Production");

  // Direct order creation modal
  const [createModalOpen, setCreateModalOpen] = useState(actionParam === "create");
  const [clients, setClients] = useState<Array<{ id: string; name: string; company?: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string; clientId: string }>>([]);
  const [newOrderClientId, setNewOrderClientId] = useState("");
  const [newOrderBrandId, setNewOrderBrandId] = useState("");
  const [newOrderType, setNewOrderType] = useState<OrderType>("manufacturing");
  const [newOrderTitle, setNewOrderTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setCreateModalOpen(true);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedType !== "ALL") params.set("type", selectedType);
      if (selectedStage !== "ALL") params.set("stage", selectedStage);
      if (selectedClient !== "ALL") params.set("clientId", selectedClient);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch {
      toast.error("Failed to load production orders");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedStage, selectedClient]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Load clients and brands for filters & modal
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => {
        if (d.clients) setClients(d.clients);
      })
      .catch(() => {});

    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => {
        if (d.brands) setBrands(d.brands);
      })
      .catch(() => {});
  }, []);

  // Aggregated field metrics
  let totalConfirmed = 0;
  let totalInferred = 0;
  let totalMissing = 0;
  let totalConflicting = 0;

  orders.forEach((ord) => {
    if (ord.fieldTruthSummary) {
      totalConfirmed += ord.fieldTruthSummary.confirmed;
      totalInferred += ord.fieldTruthSummary.inferred;
      totalMissing += ord.fieldTruthSummary.missing;
      totalConflicting += ord.fieldTruthSummary.conflicting;
    }
  });

  // Filter based on active saved view tab
  const displayedOrders = orders.filter((o) => {
    if (activeTab === "NEEDS_REVIEW") return o.status === "NEEDS_REVIEW";
    if (activeTab === "PRODUCTION") return o.lifecycleStage === "Production";
    if (activeTab === "DELIVERED") return o.lifecycleStage === "Delivered";
    return true;
  });

  // Selection toggle
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === displayedOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(displayedOrders.map((o) => o.id)));
    }
  };

  // Bulk stage update
  const handleBulkStageUpdate = async () => {
    if (selectedOrderIds.size === 0) return;
    try {
      let successCount = 0;
      let failureCount = 0;
      for (const id of Array.from(selectedOrderIds)) {
        const res = await fetch(`/api/orders/${id}/stage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: bulkStageTarget, note: "Bulk stage update" }),
        });
        if (res.ok) successCount++;
        else failureCount++;
      }
      toast.success(`Updated ${successCount} order(s) to ${bulkStageTarget}`);
      if (failureCount > 0) {
        toast.error(`${failureCount} order(s) blocked by stage gates`);
      }
      setBulkStageModal(false);
      setSelectedOrderIds(new Set());
      await fetchOrders();
    } catch {
      toast.error("Failed to perform bulk stage update");
    }
  };

  // Create direct order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderClientId) {
      toast.error("Please select a client account");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newOrderClientId,
          brandId: newOrderBrandId || undefined,
          orderType: newOrderType,
          initialTitle: newOrderTitle.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");
      toast.success(`Created order ${data.order?.orderNumber}!`);
      setCreateModalOpen(false);
      setNewOrderTitle("");
      await fetchOrders();
      if (data.order?.id) {
        router.push(`/orders/${data.order.id}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setCreating(false);
    }
  };

  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Transition order stage directly (used by Board click and drag-drop)
  const handleTransitionStage = async (orderId: string, targetStage: OrderLifecycleStage) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage, note: `Moved to ${targetStage}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stage");
      toast.success(`Order moved to "${targetStage}"`);
      await fetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to move stage");
    }
  };

  return (
    <AppShell title="Order Matrix">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-canvas min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-surface px-2.5 py-0.5 border border-border shadow-xs text-[11px] font-mono font-semibold text-ink-muted mb-1.5">
              <span>Packaging Orders</span> • <span>Active Production Pipeline</span>
            </div>
            <h1 className="text-display-sm font-display font-extrabold text-ink tracking-tight">
              Orders &amp; Packaging Pipeline
            </h1>
            <p className="text-body-xs text-ink-muted mt-1 max-w-2xl">
              Track manufacturing, custom dielines, and client consultations with verified specs from start to finish.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface border border-border rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "table" ? "bg-ink text-surface shadow-xs" : "text-ink-muted hover:text-ink"
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`p-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "board" ? "bg-ink text-surface shadow-xs" : "text-ink-muted hover:text-ink"
                }`}
                title="Kanban Board View (Draggable)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Board</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/workspace?action=ingest")}
              className="rounded-full shadow-xs text-body-xs font-semibold gap-1.5"
              title="Upload WhatsApp or chat transcript to auto-extract order"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
              <span>+ Ingest Chat</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="rounded-full shadow-tactile text-body-xs font-semibold gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Order</span>
            </Button>
          </div>
        </div>

        {/* 4 StatTiles with founder-friendly labels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Verified Specs"
            value={totalConfirmed}
            subtitle="Customer-verified & ready"
            icon={<Check className="w-4 h-4 text-[#1F8A4C] stroke-[3]" />}
            delta={{ value: "Ready", trend: "up", label: "specs" }}
          />

          <StatTile
            label="Needs Confirmation"
            value={totalInferred}
            subtitle="Inferred from past history"
            icon={<Sparkle className="w-4 h-4 text-[#B7791F] stroke-[2.2]" />}
            delta={{ value: "Review", trend: "neutral" }}
          />

          <StatTile
            label="Missing Specs"
            value={totalMissing}
            subtitle="Details needed from client"
            icon={<HelpCircle className="w-4 h-4 text-[#8E9182] stroke-[2]" />}
            delta={{ value: "Questions", trend: "neutral" }}
          />

          <StatTile
            label="Needs Attention"
            value={totalConflicting}
            subtitle="Conflicting changes flagged"
            icon={<AlertTriangle className="w-4 h-4 text-[#D64545] stroke-[2]" />}
            delta={{ value: "Action req", trend: "alert" }}
            dark={totalConflicting > 0}
          />
        </div>

        {/* Search, Saved View Tabs & Filters Bar */}
        <div className="space-y-3 bg-surface p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Saved Views Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: "ALL", label: "All Orders", count: orders.length },
                {
                  id: "NEEDS_REVIEW",
                  label: "Needs Review",
                  count: orders.filter((o) => o.status === "NEEDS_REVIEW").length,
                },
                {
                  id: "PRODUCTION",
                  label: "In Production",
                  count: orders.filter((o) => o.lifecycleStage === "Production").length,
                },
                {
                  id: "DELIVERED",
                  label: "Delivered",
                  count: orders.filter((o) => o.lifecycleStage === "Delivered").length,
                },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      active
                        ? "bg-ink text-surface shadow-xs font-bold"
                        : "bg-surface-muted text-ink-muted hover:text-ink hover:bg-surface border border-border"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active ? "bg-white/20 text-white" : "bg-border text-ink-muted"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
              <input
                type="text"
                placeholder="Search orders, clients, specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-canvas text-xs font-mono text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          {/* Company Filter Pill Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-border/60 pt-2.5">
            <span className="text-[11px] font-mono text-ink-muted flex items-center gap-1 shrink-0 font-bold">
              <Building2 className="w-3.5 h-3.5" /> Company:
            </span>
            <button
              type="button"
              onClick={() => setSelectedClient("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all shrink-0 ${
                selectedClient === "ALL"
                  ? "bg-brand-lime text-slate-950 font-bold shadow-xs border border-[#BDE82B]"
                  : "bg-surface-muted text-ink-muted hover:text-ink border border-border"
              }`}
            >
              All Companies ({orders.length})
            </button>
            {clients.map((c) => {
              const count = orders.filter((o) => o.customerId === c.id || o.customerName === c.name).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClient(selectedClient === c.id ? "ALL" : c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    selectedClient === c.id
                      ? "bg-brand-lime text-slate-950 font-bold shadow-xs border border-[#BDE82B]"
                      : "bg-surface-muted text-ink-muted hover:text-ink border border-border"
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk Action Banner */}
        {selectedOrderIds.size > 0 && (
          <div className="bg-ink text-surface px-4 py-2.5 rounded-xl flex items-center justify-between shadow-tactile animate-in fade-in duration-150">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="font-bold">{selectedOrderIds.size} orders selected</span>
              <button
                type="button"
                onClick={() => setSelectedOrderIds(new Set())}
                className="text-surface/70 hover:text-surface underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkStageModal(true)}
                className="bg-surface text-ink text-xs h-7 font-mono font-bold"
              >
                Update Stage
              </Button>
            </div>
          </div>
        )}

        {/* Orders Content: Table or Board View */}
        {loading ? (
          <div className="py-20 text-center text-body-xs text-ink-muted flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-ink border-t-brand-lime rounded-full animate-spin" />
            <span className="font-mono text-[11px]">Compiling multi-tenant orders...</span>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-surface/50 p-8 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-lime/15 border border-brand-lime/30 flex items-center justify-center text-ink shadow-sm">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="font-display font-bold text-body-md text-ink">No orders matching criteria</div>
              <p className="text-body-xs text-ink-muted leading-relaxed">
                Create a new order directly or import conversations via the Customer Inbox.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="rounded-full shadow-tactile text-body-xs font-semibold gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Direct Order</span>
              </Button>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/60 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                    <th className="py-3 px-4 w-8">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-ink-muted hover:text-ink"
                      >
                        {selectedOrderIds.size === displayedOrders.length && displayedOrders.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-ink" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">Order / Product</th>
                    <th className="py-3 px-4">Client &amp; Brand</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Verified Specs</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Activity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedOrders.map((ord) => {
                    const isSelected = selectedOrderIds.has(ord.id);
                    const prodName =
                      String(
                        (ord.currentFields?.product_type as any)?.value ||
                          (ord.currentFields?.productType as any)?.value ||
                          (ord.currentFields?.order_created as any)?.value ||
                          "Packaging Specification"
                      );

                    return (
                      <tr
                        key={ord.id}
                        className={`transition-colors hover:bg-surface-muted/40 ${
                          isSelected ? "bg-surface-muted/60" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(ord.id)}
                            className="text-ink-muted hover:text-ink"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-ink" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Order & Product */}
                        <td className="py-3 px-4 font-sans">
                          <Link
                            href={`/orders/${ord.id}`}
                            className="font-bold text-ink hover:underline flex items-center gap-1.5"
                          >
                            <span className="font-mono text-xs">{ord.orderNumber}</span>
                            <span className="text-xs text-ink-muted font-normal">• {prodName}</span>
                          </Link>
                        </td>

                        {/* Client & Brand */}
                        <td className="py-3 px-4">
                          <div className="font-sans font-medium text-ink truncate max-w-[160px]">
                            {ord.customerName}
                          </div>
                          {ord.brandName && (
                            <div className="text-[10px] text-ink-muted font-mono flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 text-brand-lime" />
                              <span>{ord.brandName}</span>
                            </div>
                          )}
                        </td>

                        {/* Order Type */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              ORDER_TYPES.find((t) => t.id === ord.orderType)?.color ||
                              "bg-surface-muted text-ink-muted border-border"
                            }`}
                          >
                            {ord.orderType || "mfg"}
                          </span>
                        </td>

                        {/* Lifecycle Stage */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-surface-muted border border-border text-[10px] font-mono font-bold text-ink">
                            {ord.lifecycleStage || "Enquiry"}
                          </span>
                        </td>

                        {/* Verified Specs Breakdown */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <span
                              className="px-1.5 py-0.2 rounded bg-[#E8F6EE] text-[#1F8A4C] border border-[#BDE6CE]"
                              title={`${ord.fieldTruthSummary?.confirmed || 0} Verified Ready`}
                            >
                              ✓ {ord.fieldTruthSummary?.confirmed || 0}
                            </span>
                            <span
                              className="px-1.5 py-0.2 rounded bg-[#FEF7EC] text-[#B7791F] border border-[#FCE0B8]"
                              title={`${ord.fieldTruthSummary?.inferred || 0} Inferred`}
                            >
                              ✦ {ord.fieldTruthSummary?.inferred || 0}
                            </span>
                            {(ord.fieldTruthSummary?.conflicting || 0) > 0 && (
                              <span
                                className="px-1.5 py-0.2 rounded bg-[#FDF2F2] text-[#D64545] border border-[#F8BDBD] font-bold"
                                title={`${ord.fieldTruthSummary?.conflicting} Conflicting`}
                              >
                                ⚠ {ord.fieldTruthSummary.conflicting}
                              </span>
                            )}
                            {(ord.fieldTruthSummary?.missing || 0) > 0 && (
                              <span
                                className="px-1.5 py-0.2 rounded bg-surface-muted text-ink-muted border border-dashed border-[#C8C5BA]"
                                title={`${ord.fieldTruthSummary?.missing} Missing`}
                              >
                                ? {ord.fieldTruthSummary.missing}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Deadline */}
                        <td className="py-3 px-4 text-ink-muted">
                          {ord.deadline ? (
                            <span className="font-mono text-[11px] text-ink">{ord.deadline}</span>
                          ) : (
                            <span className="text-[11px] text-ink-subtle">Not set</span>
                          )}
                        </td>

                        {/* Value */}
                        <td className="py-3 px-4 font-mono font-semibold">
                          <span
                            className={
                              ord.valueDisplay === "Needs quote"
                                ? "text-ink-subtle italic"
                                : "text-ink font-bold"
                            }
                          >
                            {ord.valueDisplay}
                          </span>
                        </td>

                        {/* Activity */}
                        <td className="py-3 px-4 text-ink-subtle text-[11px]">
                          {new Date(ord.lastActivity).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/inbox?id=${ord.conversationId || ""}&client=${encodeURIComponent(ord.customerName || "")}`}
                              className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink transition"
                              title={`Open ${ord.customerName} Chat`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Link>
                            <Link href={`/orders/${ord.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs font-semibold gap-1"
                              >
                                <span>Workspace</span>
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Kanban Board View with Drag & Drop */
          <div className="overflow-x-auto pb-4">
            <div className="flex items-start gap-4 min-w-[1200px]">
              {LIFECYCLE_STAGES.map((stage) => {
                const stageOrders = displayedOrders.filter((o) => (o.lifecycleStage || "Enquiry") === stage);

                return (
                  <div
                    key={stage}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverStage(stage);
                    }}
                    onDragLeave={() => {
                      if (dragOverStage === stage) setDragOverStage(null);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOverStage(null);
                      const droppedOrderId = e.dataTransfer.getData("text/plain");
                      if (droppedOrderId) {
                        await handleTransitionStage(droppedOrderId, stage);
                      }
                    }}
                    className={`w-72 shrink-0 rounded-2xl border transition-all duration-150 p-3 space-y-3 ${
                      dragOverStage === stage
                        ? "bg-brand-lime/10 border-brand-lime ring-2 ring-brand-lime/40"
                        : "bg-surface-muted/40 border-border"
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/80">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                          {stage}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-surface border border-border text-ink-muted">
                          {stageOrders.length}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-ink-subtle">Drag here</span>
                    </div>

                    {/* Cards List */}
                    <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                      {stageOrders.length === 0 ? (
                        <div className="py-8 text-center text-[11px] font-mono text-ink-subtle border border-dashed border-border rounded-xl">
                          Drop orders here
                        </div>
                      ) : (
                        stageOrders.map((ord) => {
                          const prodName =
                            String(
                              (ord.currentFields?.product_type as any)?.value ||
                                (ord.currentFields?.productType as any)?.value ||
                                "Packaging Spec"
                            );

                          return (
                            <div
                              key={ord.id}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", ord.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              className="p-3.5 bg-surface rounded-xl border border-border hover:border-ink/40 shadow-xs hover:shadow-soft transition-all duration-150 space-y-2.5 group cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <Link
                                  href={`/orders/${ord.id}`}
                                  className="font-mono text-xs font-bold text-ink group-hover:underline"
                                >
                                  {ord.orderNumber}
                                </Link>

                                <div className="flex items-center gap-1">
                                  <select
                                    value={ord.lifecycleStage || "Enquiry"}
                                    onChange={(e) =>
                                      handleTransitionStage(ord.id, e.target.value as OrderLifecycleStage)
                                    }
                                    className="text-[9px] font-mono font-bold bg-surface-muted border border-border rounded px-1.5 py-0.5 text-ink outline-none cursor-pointer"
                                    title="Click to change stage"
                                  >
                                    {LIFECYCLE_STAGES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>

                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${
                                      ORDER_TYPES.find((t) => t.id === ord.orderType)?.color ||
                                      "bg-surface-muted text-ink-muted border-border"
                                    }`}
                                  >
                                    {ord.orderType || "mfg"}
                                  </span>
                                </div>
                              </div>

                              <Link href={`/orders/${ord.id}`} className="block">
                                <div className="text-xs font-semibold text-ink line-clamp-1">{prodName}</div>
                                <div className="text-[11px] text-ink-muted truncate mt-0.5">
                                  {ord.customerName} {ord.brandName ? `• ${ord.brandName}` : ""}
                                </div>
                              </Link>

                              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border/60">
                                <span className="text-ink font-semibold">{ord.valueDisplay}</span>
                                <div className="flex items-center gap-2">
                                  {ord.deadline && (
                                    <span className="text-ink-muted flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{ord.deadline}</span>
                                    </span>
                                  )}
                                  <Link
                                    href={`/inbox?id=${ord.conversationId || ""}&client=${encodeURIComponent(ord.customerName || "")}`}
                                    className="p-1 rounded text-ink-muted hover:text-ink transition"
                                    title={`Open ${ord.customerName} Chat`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>

                              {/* Quick Actions Footer */}
                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/50 text-[10px] font-mono">
                                <Link
                                  href={`/orders/${ord.id}`}
                                  className="px-2 py-0.5 rounded bg-surface border border-border font-semibold text-ink hover:bg-surface-muted transition"
                                >
                                  Specs
                                </Link>
                                <Link
                                  href={`/orders/${ord.id}/brief`}
                                  className="px-2 py-0.5 rounded bg-surface border border-border font-semibold text-ink hover:bg-surface-muted transition"
                                >
                                  Brief
                                </Link>
                                <Link
                                  href={`/orders/${ord.id}`}
                                  className="px-2 py-0.5 rounded bg-brand-lime/20 border border-brand-lime/40 font-bold text-ink hover:bg-brand-lime/30 transition ml-auto"
                                >
                                  Open →
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Direct Order Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-display font-bold text-heading-sm text-ink">
                    Initialize New Order
                  </h3>
                  <p className="text-body-xs text-ink-muted mt-0.5">
                    Create an order for a client account and specify service scope.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">Client Account *</label>
                  <select
                    required
                    value={newOrderClientId}
                    onChange={(e) => {
                      setNewOrderClientId(e.target.value);
                      setNewOrderBrandId("");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {newOrderClientId && (
                  <div>
                    <label className="text-ink-muted block mb-1">Brand (Optional)</label>
                    <select
                      value={newOrderBrandId}
                      onChange={(e) => setNewOrderBrandId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                    >
                      <option value="">No brand / General client order</option>
                      {brands
                        .filter((b) => b.clientId === newOrderClientId)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-ink-muted block mb-1">Order Type Scope *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ORDER_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewOrderType(t.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          newOrderType === t.id
                            ? "border-ink bg-ink text-surface font-bold shadow-xs"
                            : "border-border bg-canvas text-ink hover:bg-surface-muted"
                        }`}
                      >
                        <div className="capitalize font-bold text-xs">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-ink-muted block mb-1">Product Title / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Rigid Perfume Box with Gold Hot Foil"
                    value={newOrderTitle}
                    onChange={(e) => setNewOrderTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="text-xs font-semibold bg-brand-lime hover:bg-brand-limeHover text-ink"
                  >
                    {creating ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Stage Update Modal */}
        {bulkStageModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-heading-sm text-ink">
                  Update Stage for {selectedOrderIds.size} Orders
                </h3>
                <button
                  type="button"
                  onClick={() => setBulkStageModal(false)}
                  className="p-1 rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <label className="text-ink-muted block">Select Target Stage:</label>
                <select
                  value={bulkStageTarget}
                  onChange={(e) => setBulkStageTarget(e.target.value as OrderLifecycleStage)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                >
                  {LIFECYCLE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-ink-muted">
                  Note: Moving to Production will be verified server-side and requires verified Design approval and Advance payment.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkStageModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkStageUpdate}
                  className="text-xs font-semibold bg-brand-lime hover:bg-brand-limeHover text-ink"
                >
                  Apply Update
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
