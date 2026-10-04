"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ImportModal } from "@/components/inbox/import-modal";
import { WhatsAppBubble } from "@/components/ui-ordermind/WhatsAppBubble";
import { VoiceNoteBubble } from "@/components/ui-ordermind/VoiceNoteBubble";
import { ClaimChip } from "@/components/ui-ordermind/ClaimChip";
import {
  MessageSquare,
  Plus,
  Search,
  ArrowLeft,
  Sparkles,
  Quote,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  RefreshCw,
  Paperclip,
  Send,
  File,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MessageDoc, AttachmentMeta, ExtractedEvent } from "@/server/db/schema";

interface ConversationItem {
  id: string;
  title: string;
  customerId: string;
  source: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  messageCount: number;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    company?: string;
  };
}



export default function InboxPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono">Loading Inbox...</div>}>
      <InboxContent />
    </Suspense>
  );
}

function InboxContent() {
  const searchParams = useSearchParams();
  const paramId = searchParams.get("id") || searchParams.get("conversationId");
  const paramClient = searchParams.get("client");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Array<MessageDoc & { id: string }>>([]);
  const [activeEvents, setActiveEvents] = useState<Array<ExtractedEvent & { id: string }>>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [associatedOrderId, setAssociatedOrderId] = useState<string | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processNotification, setProcessNotification] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [initialImportText, setInitialImportText] = useState("");
  const [initialCustomerName, setInitialCustomerName] = useState("");

  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [mobileClaimsOpen, setMobileClaimsOpen] = useState(false);

  // Live in-thread message & attachment composer state
  const [typedMessage, setTypedMessage] = useState("");
  const [composerRole, setComposerRole] = useState<"customer" | "business">("customer");
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentMeta[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);


  useEffect(() => {
    loadConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId, paramClient]);

  const loadConversations = async (autoSelectFirst = false) => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/inbox/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (paramId) {
          const matched = data.conversations.find(
            (c: ConversationItem) =>
              c.id === paramId ||
              (c as any)._id === paramId ||
              c.customerId === paramId
          );
          if (matched) {
            selectConversation(matched.id);
          } else {
            selectConversation(paramId);
          }
        } else if (paramClient) {
          const clientQuery = paramClient.toLowerCase().trim();
          const matched = data.conversations.find((c: ConversationItem) => {
            const custName = (c.customer?.name || "").toLowerCase();
            const custComp = (c.customer?.company || "").toLowerCase();
            const title = (c.title || "").toLowerCase();
            const custId = (c.customerId || "").toLowerCase();
            const convId = (c.id || "").toLowerCase();

            if (convId === clientQuery || custId === clientQuery) return true;
            if (custName && (custName.includes(clientQuery) || clientQuery.includes(custName))) return true;
            if (custComp && (custComp.includes(clientQuery) || clientQuery.includes(custComp))) return true;
            if (title && (title.includes(clientQuery) || clientQuery.includes(title))) return true;

            // Token-based matching on customer name, company, and title tokens
            const tokens = clientQuery.split(/[\s,._-]+/).filter((t) => t.length > 2);
            return tokens.some((t) => custName.includes(t) || custComp.includes(t) || title.includes(t));
          });
          if (matched) {
            selectConversation(matched.id);
          } else if (autoSelectFirst && data.conversations.length > 0) {
            selectConversation(data.conversations[0].id);
          }
        } else if (autoSelectFirst && data.conversations.length > 0 && !selectedConvId) {
          selectConversation(data.conversations[0].id);
        }
      }
    } catch {
      toast.error("Failed to load conversation list");
    } finally {
      setLoadingList(false);
    }
  };

  const selectConversation = async (convId: string) => {
    setSelectedConvId(convId);
    setMobileThreadOpen(true);
    setLoadingMessages(true);
    setProcessNotification(null);

    try {
      const res = await fetch(`/api/inbox/conversations/${convId}`);
      const data = await res.json();
      if (data.conversation) {
        setActiveConv(data.conversation);
        setActiveMessages(data.messages || []);
        setActiveEvents(data.events || []);

        // Also check if an associated order exists for this conversation
        try {
          const ordRes = await fetch("/api/orders");
          const ordData = await ordRes.json();
          if (ordData.orders) {
            const match = ordData.orders.find((o: { conversationId: string; id: string }) => o.conversationId === convId);
            setAssociatedOrderId(match ? match.id : null);
          }
        } catch {
          // ignore order lookup failure
        }
      }
    } catch {
      toast.error("Failed to load message thread");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleProcessConversation = async () => {
    if (!selectedConvId) return;
    setProcessing(true);
    setProcessNotification(null);

    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/process`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Processing failed");
      }

      // Reload conversation messages and events
      const updatedRes = await fetch(`/api/inbox/conversations/${selectedConvId}`);
      const updatedData = await updatedRes.json();
      if (updatedData.messages) {
        setActiveMessages(updatedData.messages);
        setActiveEvents(updatedData.events || []);
      }

      // Check order creation
      if (data.orderId) {
        setAssociatedOrderId(data.orderId);
      }

      toast.success(
        `Extraction complete: ${data.eventsCount} evidence claims extracted from ${data.processedCount} messages.`
      );
      setProcessNotification(
        `Gemma Pipeline: Processed ${data.processedCount} messages into ${data.eventsCount} validated claims.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      toast.error(msg);
      setProcessNotification(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`File "${file.name}" exceeds 10MB limit`);
      return;
    }

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedConvId) {
        formData.append("conversationId", selectedConvId);
      }

      const res = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Attachment upload failed");
      }

      const json = await res.json();
      if (json.attachment) {
        setPendingAttachments((prev) => [...prev, json.attachment]);
        toast.success(`Attached ${file.name}`);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Upload failed");
    } finally {
      setUploadingAttachment(false);
      // reset file input
      e.target.value = "";
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId) return;
    if (!typedMessage.trim() && pendingAttachments.length === 0) return;

    setSendingMessage(true);
    try {
      const content = typedMessage.trim() || (pendingAttachments.length > 0 ? `[Attached: ${pendingAttachments.map(a => a.filename).join(", ")}]` : "");
      const res = await fetch(`/api/inbox/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          senderRole: composerRole,
          senderId: composerRole === "customer" ? (activeConv?.customer?.name || "Customer") : "Operator",
          attachments: pendingAttachments,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to send message");
      }

      const json = await res.json();
      if (json.message) {
        setActiveMessages((prev) => [...prev, json.message]);
        setTypedMessage("");
        setPendingAttachments([]);
        toast.success("Message sent! You can now click 'Process Conversation' to extract new claims.");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {

    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.customer?.name || "").toLowerCase().includes(q) ||
      c.lastMessagePreview.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell title="Customer Inbox">
      <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-canvas">
        {/* PANE 1: Conversation Cards (Left Column) */}
        <div
          className={`w-full md:w-80 lg:w-[340px] flex-shrink-0 border-r border-border bg-surface flex flex-col h-full z-10 ${
            mobileThreadOpen ? "hidden md:flex" : "flex"
          }`}
        >
          {/* List Header */}
          <div className="p-3.5 border-b border-border space-y-2.5 bg-surface">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display text-body-sm font-bold text-ink">
                  Inbox
                </span>
                <span className="px-2 py-0.5 rounded-full bg-brand-lime/20 border border-brand-lime/30 text-[11px] font-mono font-bold text-ink">
                  {conversations.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setInitialImportText("");
                    setInitialCustomerName("");
                    setImportModalOpen(true);
                  }}
                  className="rounded-full h-7 px-3 text-[11px] font-semibold gap-1.5 shadow-tactile bg-brand-lime text-slate-950 hover:bg-brand-limeHover border border-[#BDE82B]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ingest Chat</span>
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations & clients..."
                className="w-full pl-8 pr-3 py-1.5 text-body-xs rounded-full bg-surface-muted/60 border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-lime"
              />
            </div>


          </div>

          {/* Conversation Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {loadingList ? (
              <div className="p-8 text-center text-body-xs text-ink-muted flex flex-col items-center gap-2.5">
                <div className="w-6 h-6 border-2 border-ink border-t-brand-lime rounded-full animate-spin"></div>
                <span className="font-mono text-[11px]">Loading chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center space-y-3.5 flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-2xl bg-brand-lime/15 border border-brand-lime/30 flex items-center justify-center text-ink shadow-sm">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-body-sm text-ink">No conversations yet</div>
                  <p className="text-[11px] text-ink-muted max-w-[220px] leading-relaxed">
                    Import a WhatsApp export .txt file or paste customer chats to start extracting production claims.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-2 pt-1 max-w-[200px]">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setImportModalOpen(true)}
                    className="rounded-full text-body-xs shadow-tactile font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Import Chat Export</span>
                  </Button>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const timeStr = new Date(conv.lastMessageAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-surface-elevated border-l-3 border-brand-lime shadow-xs"
                        : "hover:bg-surface-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-body-xs font-bold text-ink truncate">
                        {conv.customer?.name || "Customer"}
                      </span>
                      <span className="text-[10px] text-ink-subtle font-mono">{timeStr}</span>
                    </div>

                    <div className="text-[11px] font-semibold text-ink/80 truncate">
                      {conv.title}
                    </div>

                    <div className="text-[11px] text-ink-muted truncate font-sans">
                      {conv.lastMessagePreview || "No preview"}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-ink-subtle">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-surface-muted border border-border font-mono text-[9px] uppercase font-semibold text-ink-muted">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {conv.source}
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono">{conv.messageCount} messages</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PANE 2: Authentic WhatsApp Thread View */}
        <div
          className={`flex-1 flex flex-col h-full bg-[#EFE7DE] relative overflow-hidden ${
            mobileThreadOpen ? "flex" : "hidden md:flex"
          }`}
          style={{
            backgroundImage: `radial-gradient(#DFD6C9 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        >
          {selectedConvId && activeConv ? (
            <>
              {/* Thread Header Bar */}
              <div className="px-4 py-2.5 border-b border-[#D8D2C5] bg-[#F4EFE6]/95 backdrop-blur-md flex items-center justify-between gap-3 z-10 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileThreadOpen(false)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-black/5 text-ink"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-brand-lime text-ink flex items-center justify-center font-bold text-xs shadow-xs border border-brand-limeHover flex-shrink-0">
                    {activeConv.customer?.name ? activeConv.customer.name[0] : "C"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-body-xs font-bold text-ink flex items-center gap-2 truncate">
                      <span className="truncate">{activeConv.customer?.name || "Customer"}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/80 border border-[#DDD7CB] text-ink-muted font-mono flex-shrink-0">
                        Chat Channel
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {activeConv.title} &bull; {activeMessages.length} normalized items
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile toggle for claims drawer */}
                  <button
                    onClick={() => setMobileClaimsOpen(!mobileClaimsOpen)}
                    className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-ink text-white shadow-xs"
                  >
                    <Sparkles className="w-3 h-3 text-brand-lime" />
                    <span>Claims ({activeEvents.length})</span>
                  </button>

                  {/* Order Link if exists */}
                  {associatedOrderId && (
                    <Link href={`/orders/${associatedOrderId}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full h-8 px-3 text-body-xs font-semibold gap-1.5 bg-white border-[#DCD7CA] hover:bg-white/90 text-ink shadow-xs"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-[#1F8A4C]" />
                        <span>Open Order</span>
                        <ChevronRight className="w-3 h-3 text-ink-subtle" />
                      </Button>
                    </Link>
                  )}

                  {/* Process Conversation Button */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleProcessConversation}
                    disabled={processing}
                    className="rounded-full h-8 px-3.5 text-body-xs font-semibold gap-1.5 shadow-tactile"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting claims...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Process Conversation</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress Notification Banner */}
              {processNotification && (
                <div className="px-4 py-2 bg-[#D9FDD3] border-b border-[#BDEBB4] text-ink text-body-xs flex items-center justify-between animate-in fade-in-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1F8A4C] shrink-0" />
                    <span className="font-medium text-[11px] font-mono">{processNotification}</span>
                  </div>
                  <button
                    onClick={() => setProcessNotification(null)}
                    className="text-[11px] font-semibold text-ink-muted hover:text-ink underline ml-4"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Messages Thread Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-body-xs text-ink-muted">
                      <div className="w-6 h-6 border-2 border-ink border-t-brand-lime rounded-full animate-spin"></div>
                      <span className="font-mono text-[11px]">Loading thread messages...</span>
                    </div>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isCustomer = msg.senderRole === "customer";
                    const time = new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    // Match extracted events for this message
                    const msgEvents = activeEvents.filter((e) => e.messageId === msg.id);

                    // If audio type, render authentic VoiceNoteBubble
                    if (msg.type === "voice" || msg.content.includes("[Voice Note]") || msg.attachments?.some((a) => a.contentType?.startsWith("audio/"))) {
                      const audioClaims = msgEvents.map((evt) => ({
                        field: evt.field,
                        value: evt.value,
                        op: evt.op,
                        confidence: evt.confidence,
                        quote: evt.quote,
                      }));

                      return (
                        <div key={msg.id} className="w-full flex flex-col gap-1.5">
                          <VoiceNoteBubble
                            senderName={msg.senderId}
                            senderRole={msg.senderRole}
                            timestamp={time}
                            transcript={msg.content.replace("[Voice Note] ", "")}
                            isTranscribing={processing}
                            claims={audioClaims.length > 0 ? audioClaims : undefined}
                          />
                        </div>
                      );
                    }

                    // Standard Text / Image / PDF Message Bubble
                    const attachments = (msg.attachments || []).map((att: AttachmentMeta) => {
                      const isImg = att.contentType?.startsWith("image/") || att.filename.match(/\.(png|jpg|jpeg|webp)$/i);
                      const isDoc = att.contentType?.startsWith("application/pdf") || att.filename.endsWith(".pdf");
                      return {
                        id: att.id,
                        name: att.filename,
                        type: (isImg ? "image" : isDoc ? "pdf" : "file") as "image" | "pdf" | "file",
                        size: att.size ? `${(att.size / 1024).toFixed(0)} KB` : undefined,
                        url: att.url || `/api/attachments/${att.id}`,
                      };
                    });

                    return (
                      <div key={msg.id} className="w-full flex flex-col gap-1.5">
                        <WhatsAppBubble
                          id={msg.id}
                          senderName={msg.senderId}
                          senderRole={msg.senderRole}
                          content={msg.content}
                          timestamp={time}
                          readStatus="read"
                          attachments={attachments}
                        />

                        {/* Inline Claims under bubble */}
                        {msgEvents.length > 0 && (
                          <div
                            className={`flex flex-wrap gap-1 px-2 ${
                              isCustomer ? "justify-start" : "justify-end"
                            }`}
                          >
                            {msgEvents.map((evt, eIdx) => (
                              <ClaimChip
                                key={eIdx}
                                op={evt.op}
                                field={evt.field}
                                value={evt.value}
                                confidence={evt.confidence}
                                quote={evt.quote}
                                className="bg-white/90 text-[10px] py-0.5 px-2"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* In-Thread Live Message & PDF / Attachment Composer */}
              <div className="p-3 border-t border-[#D8D2C5] bg-[#F4EFE6]/95 backdrop-blur-md space-y-2 z-10 shadow-sm">
                {/* Pending Attachments Strip */}
                {pendingAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {pendingAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#DCD7CA] shadow-xs text-xs font-mono font-medium text-slate-800 animate-in fade-in-0"
                      >
                        <File className="w-3.5 h-3.5 text-brand-limeDark" />
                        <span className="truncate max-w-[140px]">{att.filename}</span>
                        <button
                          type="button"
                          onClick={() => setPendingAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                          className="w-4 h-4 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Role Switcher & Upload Button Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Send As:</span>
                    <button
                      type="button"
                      onClick={() => setComposerRole("customer")}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition ${
                        composerRole === "customer"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-200/80 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      Client ({activeConv.customer?.name ? activeConv.customer.name.split(" ")[0] : "Customer"})
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerRole("business")}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition ${
                        composerRole === "business"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-200/80 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      Operator (Studio)
                    </button>
                  </div>

                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-slate-50 border border-[#D8D2C5] text-slate-700 text-xs font-semibold cursor-pointer shadow-xs transition">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span>{uploadingAttachment ? "Uploading..." : "Attach PDF / File"}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.mp3,.dxf,.txt"
                      onChange={handleUploadAttachment}
                      disabled={uploadingAttachment}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Input & Send Button */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder={
                      composerRole === "customer"
                        ? `Type customer message (e.g. "Increase quantity to 1000", "Change substrate")...`
                        : "Type operator response..."
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#D8D2C5] text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-sans shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || (!typedMessage.trim() && pendingAttachments.length === 0)}
                    className="px-4 py-2 rounded-xl bg-brand-lime hover:bg-brand-limeHover border border-[#BDE82B] text-slate-950 font-bold text-xs shadow-tactile flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    {sendingMessage ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#DCD7CA] shadow-sm flex items-center justify-center text-ink-muted">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="font-display font-bold text-body-md text-ink">Select a conversation</div>
                <p className="text-body-xs text-ink-muted max-w-sm">
                  Choose a conversation from the sidebar or click Import to ingest a new customer chat.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportModalOpen(true)}
                className="rounded-full shadow-xs text-body-xs bg-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Import Conversation</span>
              </Button>
            </div>
          )}
        </div>

        {/* PANE 3: Dark Extracted Claims Panel (Right Column) */}
        <div
          className={`w-80 lg:w-96 flex-shrink-0 border-l border-ink/20 bg-ink text-white flex flex-col h-full z-10 ${
            mobileClaimsOpen ? "fixed inset-y-0 right-0 z-50 flex shadow-2xl" : "hidden lg:flex"
          }`}
        >
          {/* Claims Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-ink">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-lime text-ink">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-display text-body-xs font-bold tracking-tight text-white">
                Extracted Claims
              </span>
              <span className="px-2 py-0.2 rounded-full bg-white/10 text-white font-mono text-[10px] font-bold">
                {activeEvents.length}
              </span>
            </div>

            {mobileClaimsOpen && (
              <button
                onClick={() => setMobileClaimsOpen(false)}
                className="lg:hidden text-white/60 hover:text-white text-xs font-mono"
              >
                Close
              </button>
            )}
          </div>

          {/* Claims Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-[11px] font-mono text-white/60 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-1.5 text-brand-lime font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Gemma Strict Pipeline</span>
              </div>
              Output claims are validated against exact message quotes. LLM never directly touches order records.
            </div>

            {activeEvents.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-body-xs font-semibold text-white/80">No claims extracted yet</div>
                <p className="text-[11px] text-white/50 max-w-[200px] mx-auto">
                  Click &ldquo;Process Conversation&rdquo; to extract fields, detect deltas, and resolve references.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProcessConversation}
                  disabled={processing || !selectedConvId}
                  className="rounded-full h-8 text-xs border-white/20 text-white hover:bg-white/10"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-lime" />
                  <span>Extract with Gemma</span>
                </Button>
              </div>
            ) : (
              activeEvents.map((evt, idx) => {
                const isDelta = evt.op === "delta";
                const isRef = evt.op === "ref";

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-lime/40 transition-colors space-y-2 text-body-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold text-white uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
                        {evt.field}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isDelta
                            ? "bg-[#B7791F]/30 text-[#F9C985] border border-[#B7791F]/50"
                            : isRef
                            ? "bg-[#6B5BA5]/30 text-[#C4B7EC] border border-[#6B5BA5]/50"
                            : "bg-[#1F8A4C]/30 text-[#A2E6BC] border border-[#1F8A4C]/50"
                        }`}
                      >
                        {evt.op}
                      </span>
                    </div>

                    <div className="font-display font-bold text-sm text-white flex items-baseline gap-1.5">
                      <span>{String(evt.value)}</span>
                      {evt.unit && (
                        <span className="text-xs font-mono text-white/60">{evt.unit}</span>
                      )}
                    </div>

                    {evt.quote && (
                      <div className="flex items-start gap-1.5 text-[11px] text-white/70 italic bg-black/30 p-2 rounded-xl border border-white/5">
                        <Quote className="w-3 h-3 text-brand-lime shrink-0 mt-0.5" />
                        <span className="line-clamp-2">&ldquo;{evt.quote}&rdquo;</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-white/50 pt-1 border-t border-white/5">
                      <span>Confidence</span>
                      <span className="font-bold text-brand-lime">
                        {Math.round(evt.confidence > 1 ? evt.confidence : evt.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Claims Footer Action */}
          {associatedOrderId && (
            <div className="p-3 border-t border-white/10 bg-black/20">
              <Link href={`/orders/${associatedOrderId}`} className="w-full">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full rounded-full h-8 text-xs font-semibold justify-between bg-brand-lime text-ink hover:bg-brand-limeHover"
                >
                  <span>Open Structured Order Workspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        initialText={initialImportText}
        initialCustomerName={initialCustomerName}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={(newConvId) => {
          loadConversations(false);
          selectConversation(newConvId);
        }}
      />
    </AppShell>
  );
}
