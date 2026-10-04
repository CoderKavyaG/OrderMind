"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FieldRow } from "@/components/ui-ordermind/FieldRow";
import { StatusChip, OrderFieldStatus } from "@/components/ui-ordermind/StatusChip";
import { ConflictCard } from "@/components/ui-ordermind/ConflictCard";
import { ChangeTimeline } from "@/components/ui-ordermind/ChangeTimeline";
import { TimelineDock } from "@/components/ui-ordermind/TimelineDock";
import { EvidencePopover } from "@/components/ui-ordermind/EvidencePopover";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Quote,
  Edit2,
  Check,
  X,
  History,
  GitCommit,
  Layers,
  ChevronRight,
  ShieldCheck,
  Copy,
  AlertOctagon,
  ArrowRight,
  Send,
  Lock,
  FileCheck,
  FileText,
  Calendar,
  Package,
  Plus,
  Trash2,
  Upload,
  File,
  DollarSign,
  Pin,
  Tag,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderWithDetails } from "@/server/services/order.service";
import type { ComputedField } from "@/server/services/orderReducer";
import type {
  ClarificationDoc,
  OrderType,
  OrderLifecycleStage,
  QuoteStatus,
  QuoteLineItem,
  OrderQuoteDoc,
  Note,
} from "@/server/db/schema";
import type { DetectedConflict } from "@/server/services/conflictDetector";

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

const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: "manufacturing", label: "Manufacturing" },
  { id: "design", label: "Design" },
  { id: "consultation", label: "Consultation" },
];

export default function OrderWorkspacePage() {
  const params = useParams();
  const orderId = params.id as string;

  const [orderData, setOrderData] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dark side panel evidence state
  const [activeEvidenceField, setActiveEvidenceField] = useState<ComputedField | null>(null);

  // Edit modal state
  const [editingField, setEditingField] = useState<ComputedField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editNote, setEditNote] = useState("");

  // Conflict resolution modal state
  const [resolvingConflict, setResolvingConflict] = useState<{
    field: string;
    conflict: DetectedConflict;
  } | null>(null);

  // Clarification reply modal state
  const [answeringClarification, setAnsweringClarification] = useState<
    (ClarificationDoc & { id: string }) | null
  >(null);
  const [customerReplyText, setCustomerReplyText] = useState("");
  const [copiedClarificationId, setCopiedClarificationId] = useState<string | null>(null);

  // Timeline scrubber dock state
  const [currentEventStep, setCurrentEventStep] = useState(0);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Stage gate alert & state
  const [stageError, setStageError] = useState<string | null>(null);

  // Deadline modal
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");

  // Quote state (for Manufacturing)
  const [quote, setQuote] = useState<OrderQuoteDoc | null>(null);
  const [quoteLineItems, setQuoteLineItems] = useState<QuoteLineItem[]>([]);
  const [quoteMaterialCost, setQuoteMaterialCost] = useState(0);
  const [quoteFinishCost, setQuoteFinishCost] = useState(0);
  const [quoteAccessoriesCost, setQuoteAccessoriesCost] = useState(0);
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>("Draft");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);

  // Scoped Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNotePinned, setNewNotePinned] = useState(false);

  // Upload attachment state
  const [uploading, setUploading] = useState(false);

  const fetchOrder = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load order workspace");
      }
      setOrderData(data.order);
      if (data.order?.events?.length) {
        setCurrentEventStep(data.order.events.length - 1);
      }
      if (data.order?.quote) {
        setQuote(data.order.quote);
        setQuoteLineItems(data.order.quote.lineItems || []);
        setQuoteMaterialCost(data.order.quote.materialCostINR || 0);
        setQuoteFinishCost(data.order.quote.finishCostINR || 0);
        setQuoteAccessoriesCost(data.order.quote.accessoriesCostINR || 0);
        setQuoteStatus(data.order.quote.status || "Draft");
        setQuoteNotes(data.order.quote.notes || "");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading order workspace");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [orderId]);

  const fetchNotes = useCallback(async (idToUse?: string) => {
    try {
      const tid = idToUse || orderData?.id || orderId;
      const res = await fetch(`/api/notes?scope=order&targetId=${tid}`);
      const data = await res.json();
      if (data.notes) setNotes(data.notes);
    } catch {
      //
    }
  }, [orderId, orderData?.id]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchNotes();
    }
  }, [orderId, fetchOrder, fetchNotes]);

  // Stage transition
  const handleTransitionStage = async (newStage: OrderLifecycleStage) => {
    setSubmittingAction(true);
    setStageError(null);
    try {
      const targetId = orderData?.id || orderId;
      const res = await fetch(`/api/orders/${targetId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStageError(data.error || "Stage transition blocked");
        throw new Error(data.error || "Stage transition failed");
      }
      setOrderData(data.order);
      toast.success(`Order stage updated to "${newStage}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change stage");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Record stage-gate approval (Design approved / Advance paid)
  const handleRecordGate = async (gate: "design_approved" | "advance_paid") => {
    setSubmittingAction(true);
    setStageError(null);
    try {
      const targetId = orderData?.id || orderId;
      const res = await fetch(`/api/orders/${targetId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record approval");
      setOrderData(data.order);
      toast.success(
        gate === "design_approved"
          ? "Recorded human verification: Design approved"
          : "Recorded human verification: Advance paid"
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record approval");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Switch Order Type
  const handleChangeOrderType = async (newType: OrderType) => {
    setSubmittingAction(true);
    try {
      const targetId = orderData?.id || orderId;
      const res = await fetch(`/api/orders/${targetId}/type`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderType: newType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change order type");
      setOrderData(data.order);
      toast.success(`Switched order scope to "${newType}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update order type");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Set Deadline Task Event
  const handleSetDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineDate) return;
    setSubmittingAction(true);
    try {
      const targetId = orderData?.id || orderId;
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deadline",
          title: `Dispatch Deadline for ${orderData?.orderNumber}`,
          dueAt: new Date(deadlineDate).toISOString(),
          orderId: targetId,
        }),
      });
      if (!res.ok) throw new Error("Failed to record deadline");
      // Also update field event
      await fetch(`/api/orders/${targetId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "deadline",
          action: "edit",
          newValue: deadlineDate,
          note: "Deadline schedule event established",
        }),
      });
      setDeadlineModalOpen(false);
      toast.success(`Deadline set to ${deadlineDate}`);
      await fetchOrder();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to set deadline");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Save Quote
  const handleSaveQuote = async () => {
    setSavingQuote(true);
    try {
      const targetId = orderData?.id || orderId;
      const res = await fetch(`/api/orders/${targetId}/quote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: quoteStatus,
          lineItems: quoteLineItems,
          materialCostINR: quoteMaterialCost,
          finishCostINR: quoteFinishCost,
          accessoriesCostINR: quoteAccessoriesCost,
          notes: quoteNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save quote");
      setQuote(data.quote);
      toast.success(`Quote saved (${data.quote.status}): ₹${data.quote.totalINR.toLocaleString("en-IN")}`);
      await fetchOrder();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save quote");
    } finally {
      setSavingQuote(false);
    }
  };

  // Add Quote Line Item
  const handleAddLineItem = () => {
    const newItem: QuoteLineItem = {
      id: `li_${Date.now()}`,
      description: "Custom Rigid Box Structure",
      quantity: 500,
      unitPriceINR: 50,
      totalINR: 25000,
    };
    setQuoteLineItems((prev) => [...prev, newItem]);
  };

  const handleUpdateLineItem = (id: string, updates: Partial<QuoteLineItem>) => {
    setQuoteLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.totalINR = (updated.quantity || 0) * (updated.unitPriceINR || 0);
        return updated;
      })
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setQuoteLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      const targetId = orderData?.id || orderId;
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "order",
          targetId: targetId,
          content: newNoteContent.trim(),
          pinned: newNotePinned,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Note added");
        setNewNoteContent("");
        setNewNotePinned(false);
        if (data.note) {
          setNotes((prev) => [data.note, ...prev]);
        }
        await fetchNotes(targetId);
      } else {
        toast.error("Failed to add note");
      }
    } catch {
      toast.error("Failed to add note");
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes?id=${noteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Note deleted");
        await fetchNotes();
      }
    } catch {
      toast.error("Failed to delete note");
    }
  };

  // Upload file attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const targetId = orderData?.id || orderId;
      formData.append("orderId", targetId);
      const res = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.success(`Attached "${file.name}" to order workspace`);
      await fetchOrder();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Confirm single field
  const handleConfirmField = useCallback(
    async (fieldKey: string) => {
      setSubmittingAction(true);
      try {
        const res = await fetch(`/api/orders/${orderId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: fieldKey, action: "confirm" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Confirmation failed");
        setOrderData(data.order);
        toast.success(`Confirmed specification for ${fieldKey}`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to confirm field");
      } finally {
        setSubmittingAction(false);
      }
    },
    [orderId]
  );

  // Save Field Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: editingField.field,
          action: "edit",
          newValue: editValue,
          unit: editUnit,
          note: editNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Edit failed");
      setOrderData(data.order);
      setEditingField(null);
      toast.success(`Updated spec for ${editingField.label}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to edit field");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Resolve conflict
  const handleResolveConflict = async (
    fieldKey: string,
    chosenValue: unknown,
    label: string,
    unit?: string
  ) => {
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: fieldKey,
          action: "resolve_conflict",
          newValue: chosenValue,
          unit,
          note: `Operator resolved conflict: selected ${label}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve conflict");
      setOrderData(data.order);
      setResolvingConflict(null);
      toast.success(`Conflict resolved for ${fieldKey}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve conflict");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Copy Clarification Question
  const handleCopyQuestion = (clarification: ClarificationDoc & { id: string }) => {
    navigator.clipboard.writeText(clarification.question);
    setCopiedClarificationId(clarification.id);
    toast.success("Question copied to clipboard");
    setTimeout(() => setCopiedClarificationId(null), 2500);
  };

  // Paste Customer Reply
  const handleSubmitCustomerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringClarification || !customerReplyText.trim()) return;
    setSubmittingAction(true);
    const clarId = answeringClarification.id;
    const reply = customerReplyText.trim();
    try {
      const targetOrderId = orderData?.id || orderId;
      const res = await fetch(
        `/api/orders/${targetOrderId}/clarifications/${clarId}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replyText: reply }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process customer reply");
      
      setAnsweringClarification(null);
      setCustomerReplyText("");
      if (data.order) {
        setOrderData(data.order);
      }
      toast.success("Customer reply processed into order events!");
      await fetchOrder(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record customer reply");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Lock & Confirm All
  const handleConfirmAll = async () => {
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_all" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to lock order");
      setOrderData(data.order);
      toast.success("Order specifications verified & locked for production!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to lock order");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Order Workspace">
        <div className="py-24 text-center text-body-xs text-ink-muted flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-ink border-t-brand-lime rounded-full animate-spin" />
          <span className="font-mono text-[11px]">Replaying deterministic order state...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !orderData) {
    return (
      <AppShell title="Order Workspace">
        <div className="p-8 max-w-xl mx-auto text-center space-y-4">
          <div className="text-body-xs font-semibold text-[#D64545]">{error || "Order not found"}</div>
          <Link href="/orders">
            <Button variant="outline" size="sm" className="rounded-full">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Orders Matrix</span>
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const { reducedState, customer, events, versions, changes, clarifications } = orderData;
  const fieldsList = Object.values(reducedState.fields);
  const openClarifications = clarifications?.filter((c) => c.status === "open") || [];
  const conflictingFields = fieldsList.filter((f) => f.status === "CONFLICTING");

  const isConfirmed = orderData.status === "CONFIRMED";
  const canConfirmAll =
    reducedState.missingFields.length === 0 &&
    reducedState.inferredCount === 0 &&
    reducedState.conflictingCount === 0 &&
    !isConfirmed;

  // Check stage gate status
  const hasDesignApproved = events.some(
    (e) =>
      e.actor === "human" &&
      (e.field === "stage_gate:design_approved" || e.field === "design_approved")
  );
  const hasAdvancePaid = events.some(
    (e) =>
      e.actor === "human" &&
      (e.field === "stage_gate:advance_paid" || e.field === "advance_paid")
  );

  const quoteTotalCalc =
    quoteLineItems.reduce((acc, i) => acc + (i.totalINR || 0), 0) +
    quoteMaterialCost +
    quoteFinishCost +
    quoteAccessoriesCost;

  return (
    <AppShell title={`Order ${orderData.orderNumber}`}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] overflow-hidden bg-canvas">
        {/* Main Center Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl p-6 bg-surface border border-border shadow-soft space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-mono text-ink-muted">
                  <Link href="/orders" className="hover:text-ink flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    <span>Orders</span>
                  </Link>
                  <span>/</span>
                  <span className="font-bold text-ink">{orderData.orderNumber}</span>
                  {orderData.brand && (
                    <>
                      <span>/</span>
                      <span className="text-brand-lime font-bold">{orderData.brand.name}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-display text-display-sm font-extrabold text-ink tracking-tight">
                    {customer?.name || "Client"}
                  </h1>
                  <StatusChip status={orderData.status} />

                  {/* Order Type Badge & Switcher */}
                  <div className="flex items-center gap-1.5 bg-canvas border border-border rounded-xl px-2.5 py-1">
                    <span className="text-[10px] font-mono text-ink-muted uppercase">Scope:</span>
                    <select
                      value={orderData.orderType || "manufacturing"}
                      onChange={(e) => handleChangeOrderType(e.target.value as OrderType)}
                      className="text-xs font-mono font-bold bg-transparent text-ink outline-none cursor-pointer"
                    >
                      {ORDER_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {versions.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#1F8A4C]/15 text-[#1F8A4C] border border-[#1F8A4C]/30 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>v{versions.length} Locked Snapshot</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-body-xs text-ink-muted flex-wrap pt-1 font-mono">
                  <span>
                    Company: <strong className="text-ink">{customer?.company || customer?.name}</strong>
                  </span>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={() => setDeadlineModalOpen(true)}
                    className="flex items-center gap-1 hover:text-ink transition underline cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
                    <span>
                      Deadline:{" "}
                      <strong className="text-ink">
                        {reducedState.fields.deadline?.value
                          ? String(reducedState.fields.deadline.value)
                          : orderData.deadlineEvent?.dueAt
                          ? new Date(orderData.deadlineEvent.dueAt).toLocaleDateString()
                          : "Set Deadline"}
                      </strong>
                    </span>
                  </button>
                  <span>&bull;</span>
                  <Link
                    href={`/inbox?id=${orderData.conversationId || ""}&client=${encodeURIComponent(orderData.customer?.name || "")}`}
                    className="hover:text-ink font-semibold flex items-center gap-1 text-ink-muted transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Chat</span>
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                {!isConfirmed && (
                  canConfirmAll ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleConfirmAll}
                      disabled={submittingAction}
                      className="rounded-full shadow-tactile text-xs font-semibold gap-1.5 bg-brand-lime text-slate-950 hover:bg-brand-limeHover"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock &amp; Confirm Order</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="rounded-full text-xs font-semibold gap-1.5 bg-surface-muted text-ink-subtle border-border opacity-70 cursor-not-allowed font-mono"
                      title="All required specifications must be verified and confirmed without missing fields or conflicts"
                    >
                      <Lock className="w-3.5 h-3.5 text-ink-subtle" />
                      <span>
                        Lock Order ({reducedState.missingFields.length} missing
                        {reducedState.conflictingCount > 0 ? `, ${reducedState.conflictingCount} conflict` : ""}
                        {reducedState.inferredCount > 0 ? `, ${reducedState.inferredCount} inferred` : ""})
                      </span>
                    </Button>
                  )
                )}

                {isConfirmed ? (
                  <Link href={`/orders/${orderId}/brief`}>
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-full shadow-tactile text-xs font-semibold gap-1.5 bg-[#1F8A4C] hover:bg-[#18723E] text-white"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Generate Production Brief</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/orders/${orderId}/brief`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs font-semibold gap-1.5 bg-surface-muted hover:bg-surface text-ink-subtle hover:text-ink border-border"
                      title="Click to view Production Brief checklist and requirement status"
                    >
                      <Lock className="w-3.5 h-3.5 text-ink-subtle" />
                      <span>Production Brief (Locked &bull; View Checklist)</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Lifecycle Stage Gates Banner */}
            <div className="pt-4 border-t border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted uppercase tracking-wider text-[11px]">
                  Lifecycle Stage:
                </span>
                <select
                  value={orderData.lifecycleStage || "Enquiry"}
                  onChange={(e) => handleTransitionStage(e.target.value as OrderLifecycleStage)}
                  disabled={submittingAction}
                  className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-ink font-bold text-xs font-mono outline-none"
                >
                  {LIFECYCLE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage Gate Badges & Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {hasDesignApproved ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F6EE] text-[#1F8A4C] border border-[#BDE6CE] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Design Approved
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecordGate("design_approved")}
                    disabled={submittingAction}
                    className="h-7 text-[11px] gap-1 bg-surface font-semibold"
                  >
                    <Check className="w-3 h-3" /> Record Design Approved
                  </Button>
                )}

                {hasAdvancePaid ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F6EE] text-[#1F8A4C] border border-[#BDE6CE] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Advance Paid
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecordGate("advance_paid")}
                    disabled={submittingAction}
                    className="h-7 text-[11px] gap-1 bg-surface font-semibold"
                  >
                    <DollarSign className="w-3 h-3" /> Record Advance Paid
                  </Button>
                )}
              </div>
            </div>

            {/* Stage Gate Error Alert if blocked */}
            {stageError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{stageError}</span>
              </div>
            )}
          </div>

          {/* Active Conflicts Cards */}
          {conflictingFields.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D64545]" />
                <h2 className="font-display font-bold text-body-sm text-ink uppercase tracking-wider">
                  Contradictory Specification Conflicts ({conflictingFields.length})
                </h2>
              </div>
              <div className="space-y-3">
                {conflictingFields.map((f) => {
                  const candA = f.conflict?.candidates?.[0];
                  const candB = f.conflict?.candidates?.[1];
                  const optionA = {
                    label: String(candA?.value || "Option A"),
                    value: (candA?.value ?? "Option A") as string | number,
                    quote: candA?.quote || "",
                    source: `Msg #${candA?.messageId?.slice(-4) || "1"}`,
                  };
                  const optionB = {
                    label: String(candB?.value || "Option B"),
                    value: (candB?.value ?? "Option B") as string | number,
                    quote: candB?.quote || "",
                    source: `Msg #${candB?.messageId?.slice(-4) || "2"}`,
                  };

                  return (
                    <ConflictCard
                      key={f.field}
                      field={f.label}
                      explanation={f.conflict?.explanation || "Conflicting claims detected."}
                      optionA={optionA}
                      optionB={optionB}
                      onResolve={(choice) => {
                        const chosen = choice === "A" ? optionA : optionB;
                        handleResolveConflict(f.field, chosen.value, chosen.label, f.unit);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Clarifications */}
          {openClarifications.length > 0 && (
            <div className="rounded-2xl p-5 bg-surface border border-border shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink">
                      Pending Clarifications ({openClarifications.length})
                    </h2>
                    <p className="text-[11px] text-ink-muted">
                      Missing requirements drafted by Gemma. Copy and paste to customer, or paste customer answer to reprocess.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {openClarifications.map((clar) => {
                  const isCopied = copiedClarificationId === clar.id;
                  return (
                    <div
                      key={clar.id}
                      className="p-4 rounded-xl border border-border bg-[#F7FAFD] flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-border text-ink">
                          Missing: {clar.fieldLabel || clar.field}
                        </span>
                        <p className="text-body-xs font-sans text-ink leading-relaxed italic">
                          &ldquo;{clar.question}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#E3EDF6]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyQuestion(clar)}
                          className="rounded-full h-7 px-3 text-[11px] font-semibold gap-1 bg-white hover:bg-surface-muted"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-[#1F8A4C]" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Question</span>
                            </>
                          )}
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setAnsweringClarification(clar);
                            setCustomerReplyText("");
                          }}
                          className="rounded-full h-7 px-3 text-[11px] font-semibold gap-1 shadow-tactile"
                        >
                          <Send className="w-3 h-3" />
                          <span>Paste Reply</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specifications Matrix Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-body-sm text-ink uppercase tracking-wider">
                  Specifications &amp; Claims Matrix ({orderData.orderType || "manufacturing"})
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Replayed deterministically from timeline events. Human confirm or edit overrides candidate values.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {fieldsList.map((f) => {
                const evidenceItem = f.evidence?.[0]
                  ? {
                      quote: f.evidence[0].quote || "",
                      source: `Message #${f.evidence[0].messageId?.slice(-4) || "1"}`,
                      timestamp: new Date(f.evidence[0].timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      messageId: f.evidence[0].messageId,
                      actor: f.evidence[0].actor as "ai" | "human",
                    }
                  : null;

                return (
                  <FieldRow
                    key={f.field}
                    label={f.label}
                    value={f.value}
                    unit={f.unit}
                    status={f.status as OrderFieldStatus}
                    evidence={evidenceItem}
                    onConfirm={
                      f.status === "INFERRED" ? () => handleConfirmField(f.field) : undefined
                    }
                    onEdit={() => {
                      setEditingField(f);
                      setEditValue(f.value !== null && f.value !== undefined ? String(f.value) : "");
                      setEditUnit(f.unit || "");
                      setEditNote("");
                    }}
                    onJumpToMessage={() => {
                      setActiveEvidenceField(f);
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Manufacturing Quote Section (for Manufacturing Orders only) */}
          {(orderData.orderType === "manufacturing" || !orderData.orderType) && (
            <div className="rounded-2xl p-6 bg-surface border border-border shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted uppercase">
                    <DollarSign className="w-3.5 h-3.5 text-brand-lime" />
                    <span>Commercial Quotation (Manual Entry)</span>
                  </div>
                  <h3 className="font-display font-bold text-heading-sm text-ink">
                    Plant Cost Breakdown &amp; Commercial Pricing
                  </h3>
                  <p className="text-body-xs text-ink-muted">
                    No AI pricing. Enter exact estimator numbers for board, finish, and foam accessories.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={quoteStatus}
                    onChange={(e) => setQuoteStatus(e.target.value as QuoteStatus)}
                    className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-xs font-mono font-bold text-ink"
                  >
                    <option value="Draft">Status: Draft</option>
                    <option value="Sent">Status: Sent</option>
                    <option value="Accepted">Status: Accepted</option>
                  </select>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveQuote}
                    disabled={savingQuote}
                    className="text-xs font-semibold bg-brand-lime hover:bg-brand-limeHover text-ink shadow-xs"
                  >
                    {savingQuote ? "Saving..." : "Save Quote"}
                  </Button>
                </div>
              </div>

              {/* Line items table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-ink-muted">
                    Production Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-mono text-ink font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-xs font-mono">
                    <thead className="bg-surface-muted border-b border-border text-ink-muted">
                      <tr>
                        <th className="py-2 px-3 text-left">Description</th>
                        <th className="py-2 px-3 text-right w-24">Qty</th>
                        <th className="py-2 px-3 text-right w-32">Unit INR</th>
                        <th className="py-2 px-3 text-right w-32">Total INR</th>
                        <th className="py-2 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {quoteLineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateLineItem(item.id, { description: e.target.value })
                              }
                              className="w-full px-2 py-1 rounded border border-border bg-canvas text-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateLineItem(item.id, {
                                  quantity: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full text-right px-2 py-1 rounded border border-border bg-canvas text-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={item.unitPriceINR}
                              onChange={(e) =>
                                handleUpdateLineItem(item.id, {
                                  unitPriceINR: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full text-right px-2 py-1 rounded border border-border bg-canvas text-xs"
                            />
                          </td>
                          <td className="p-2 text-right font-bold">
                            ₹{(item.totalINR || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="text-ink-muted hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-costs breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">Material Core Cost (INR)</label>
                  <input
                    type="number"
                    value={quoteMaterialCost}
                    onChange={(e) => setQuoteMaterialCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-canvas text-ink"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">Finish &amp; Foil Cost (INR)</label>
                  <input
                    type="number"
                    value={quoteFinishCost}
                    onChange={(e) => setQuoteFinishCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-canvas text-ink"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">Trays &amp; Inserts Cost (INR)</label>
                  <input
                    type="number"
                    value={quoteAccessoriesCost}
                    onChange={(e) => setQuoteAccessoriesCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-canvas text-ink"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                <span className="text-ink-muted">Commercial Total:</span>
                <span className="text-display-xs font-extrabold text-ink font-sans">
                  ₹{quoteTotalCalc.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          {/* Scoped Notes & Reference Attachments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Notes */}
            <div className="rounded-2xl p-5 bg-surface border border-border shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-lime" />
                  <h3 className="font-display font-bold text-body-sm text-ink uppercase tracking-wider">
                    Order Notes ({notes.length})
                  </h3>
                </div>
              </div>

              <form onSubmit={handleAddNote} className="space-y-2 text-xs font-mono">
                <textarea
                  rows={2}
                  placeholder="Record order instruction or QC checkpoint note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-canvas text-ink text-xs font-sans outline-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-ink-muted cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={newNotePinned}
                      onChange={(e) => setNewNotePinned(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>Pin to top</span>
                  </label>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 font-semibold"
                  >
                    Add Note
                  </Button>
                </div>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-canvas border border-border text-xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      {n.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      <p className="font-sans text-ink">{n.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(n.id!)}
                      className="text-ink-subtle hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div className="rounded-2xl p-5 bg-surface border border-border shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-brand-lime" />
                  <h3 className="font-display font-bold text-body-sm text-ink uppercase tracking-wider">
                    Attachments &amp; Reference Files
                  </h3>
                </div>
              </div>

              <div className="border border-dashed border-border rounded-xl p-4 text-center space-y-2 bg-canvas">
                <input
                  type="file"
                  id="order-file-input"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="order-file-input"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-mono font-semibold text-ink cursor-pointer hover:bg-surface-muted transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? "Uploading..." : "Upload Artwork / Dieline"}</span>
                </label>
                <p className="text-[10px] font-mono text-ink-muted">
                  Supports PDF dielines, PNG previews, and AI artwork (Max 10MB)
                </p>
              </div>

              {orderData?.attachments && orderData.attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono font-bold text-ink uppercase tracking-wider">
                    Attached Files ({orderData.attachments.length})
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {orderData.attachments.map((att) => {
                      const isImg = att.contentType?.startsWith("image/") || att.filename.match(/\.(png|jpg|jpeg|webp)$/i);
                      return (
                        <div
                          key={att.id}
                          className="p-2 rounded-xl bg-canvas border border-border flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isImg ? (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-9 h-9 rounded-lg overflow-hidden border border-border bg-white flex-shrink-0 group cursor-pointer"
                                title="Click to view image"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={att.url}
                                  alt={att.filename}
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                              </a>
                            ) : (
                              <File className="w-4 h-4 text-brand-lime shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="font-semibold text-ink truncate">{att.filename}</p>
                              <p className="text-[10px] text-ink-muted font-mono">
                                {(att.size / 1024).toFixed(1)} KB &bull; {att.contentType}
                              </p>
                            </div>
                          </div>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-surface border border-border text-[11px] font-semibold text-ink hover:bg-surface-muted transition shrink-0"
                          >
                            Open File
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diffs & Plain English What Changed Timeline */}
          {changes && changes.length > 0 && (
            <div className="rounded-2xl p-5 bg-surface border border-border shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-lime" />
                  <h2 className="font-display font-bold text-body-xs uppercase tracking-wider text-ink">
                    Plain-English Specification Diffs
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">
                  {changes.length} recorded events
                </span>
              </div>

              <div className="space-y-3">
                {changes.map((chg) => (
                  <div
                    key={chg.id}
                    className="p-3.5 rounded-xl border border-border/80 bg-surface-muted/40 flex items-start gap-3"
                  >
                    <div className="mt-0.5">
                      <span className="h-6 w-6 rounded-full bg-brand-lime/20 border border-brand-lime/40 text-ink flex items-center justify-center text-xs font-mono font-bold">
                        Δ
                      </span>
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-body-xs text-ink">
                          {chg.fieldLabel}
                        </span>
                        <span className="text-[11px] font-mono text-ink-muted">
                          {new Date(chg.when).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-body-xs text-ink leading-relaxed">{chg.explanation}</p>
                      {chg.evidenceQuote && (
                        <div className="flex items-center gap-1.5 text-mono-evidence font-mono italic text-ink-muted bg-surface/70 px-2 py-1 rounded border border-border/60">
                          <Quote className="w-3 h-3 text-ink-subtle shrink-0" />
                          <span>&ldquo;{chg.evidenceQuote}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Timeline Dock & Audit Trail */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-surface flex flex-col h-auto lg:h-full overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-brand-lime" />
              <span className="font-display font-bold text-xs uppercase tracking-wider text-ink">
                Immutable Event History
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-muted text-ink-muted">
              {events.length} events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            {events.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className="p-3 rounded-xl bg-canvas border border-border space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      ev.actor === "human"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-brand-lime/30 text-ink"
                    }`}
                  >
                    {ev.actor}
                  </span>
                  <span className="text-ink-subtle">
                    {new Date(ev.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="font-bold text-ink">{ev.field}</div>
                <div className="text-ink-muted text-[11px] break-all">
                  Value: {String(ev.newValue)} {ev.unit || ""}
                </div>
                {ev.source?.quote && (
                  <div className="text-[10px] italic text-ink-subtle border-l-2 border-brand-lime pl-1.5">
                    &ldquo;{ev.source.quote}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Set Deadline Modal */}
        {deadlineModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-sm w-full shadow-2xl space-y-4">
              <h3 className="font-display font-bold text-heading-sm text-ink">Set Dispatch Deadline</h3>
              <form onSubmit={handleSetDeadline} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">Target Dispatch Date</label>
                  <input
                    type="date"
                    required
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeadlineModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="text-xs font-semibold bg-brand-lime hover:bg-brand-limeHover text-ink"
                  >
                    Set Deadline
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Field Modal */}
        {editingField && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-display font-bold text-heading-sm text-ink">
                Edit Specification: {editingField.label}
              </h3>
              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">New Specification Value *</label>
                  <input
                    type="text"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">Unit (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. GSM, mm, boxes"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">Audit Note</label>
                  <input
                    type="text"
                    placeholder="Reason for manual adjustment..."
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingField(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="text-xs font-semibold bg-brand-lime hover:bg-brand-limeHover text-ink"
                  >
                    Confirm &amp; Record Event
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Paste Customer Reply Modal */}
        {answeringClarification && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-display font-bold text-heading-sm text-ink">
                Paste Customer Reply
              </h3>
              <p className="text-body-xs text-ink-muted">
                Question asked: &ldquo;{answeringClarification.question}&rdquo;
              </p>
              <form onSubmit={handleSubmitCustomerReply} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">Raw Customer Reply *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Yes please make it 500 units and dispatch before Nov 15th."
                    value={customerReplyText}
                    onChange={(e) => setCustomerReplyText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAnsweringClarification(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingAction || !customerReplyText.trim()}
                    className="text-xs font-semibold bg-brand-lime hover:bg-brand-limeHover text-ink disabled:opacity-50 min-w-[120px]"
                  >
                    {submittingAction ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Process Reply"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
