"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Video,
  Phone,
  MessageSquare,
  FileText,
  Download,
  Settings,
  Bell,
  Sparkles,
  Pin,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  X,
  User,
  ShieldCheck,
  Check,
  Mail,
  Instagram,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { WorkspaceDashboardData } from "@/server/services/workspaceHome.service";

interface SelectedInspectorClient {
  id: string;
  name: string;
  company: string;
  avatar: string;
  title: string;
  productStructure: string;
  quantity: string;
  dimensions: string;
  material: string;
  orderId?: string;
  conversationId?: string;
  documents: Array<{ name: string; type: string; badge: string; url?: string }>;
}

export default function WorkspaceHomePage() {
  const router = useRouter();
  const [data, setData] = React.useState<WorkspaceDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Filter States
  const [clientFilter, setClientFilter] = React.useState<string>("All");
  const [taskFilter, setTaskFilter] = React.useState<string>("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Ingestion Modal State (+ New Order Chat)
  const [showIngestModal, setShowIngestModal] = React.useState(false);
  const [pastedChat, setPastedChat] = React.useState("");
  const [ingestingClientName, setIngestingClientName] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = React.useState(false);
  const [newCustName, setNewCustName] = React.useState("");
  const [newCustCompany, setNewCustCompany] = React.useState("");
  const [newCustEmail, setNewCustEmail] = React.useState("");
  const [newCustPhone, setNewCustPhone] = React.useState("");
  const [newCustInstagram, setNewCustInstagram] = React.useState("");
  const [isSubmittingCustomer, setIsSubmittingCustomer] = React.useState(false);

  // Interactive Task Card States: completion, pinning, notification reminder
  const [completedTaskIds, setCompletedTaskIds] = React.useState<Set<string>>(new Set());
  const [pinnedTaskIds, setPinnedTaskIds] = React.useState<Set<string>>(new Set());
  const [remindedTaskIds, setRemindedTaskIds] = React.useState<Set<string>>(new Set());

  // Persistent Top Meeting Notification State
  const [showMeetingBanner, setShowMeetingBanner] = React.useState(false);
  const [meetingStatus, setMeetingStatus] = React.useState<"in_progress" | "waiting" | "completed" | "rescheduled">("waiting");
  const [meetingScheduleModal, setMeetingScheduleModal] = React.useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = React.useState(false);
  const [rescheduleCustomTime, setRescheduleCustomTime] = React.useState("");
  const [scheduledMeeting, setScheduledMeeting] = React.useState<{
    title: string;
    clientName: string;
    company: string;
    time: string;
    meetingDateTime: string;
    phone: string;
    orderId?: string;
    notified?: boolean;
  }>({
    title: "",
    clientName: "",
    company: "",
    time: "",
    meetingDateTime: "",
    phone: "",
    orderId: "",
    notified: false,
  });

  // Synthesize a pleasant dual-tone meeting chime with Web Audio API (zero external assets)
  const playNotificationChime = React.useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // D6

      gainNode.gain.setValueAtTime(0.28, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.7);
      osc2.stop(ctx.currentTime + 0.7);
    } catch {
      // Audio playback fallback
    }
  }, []);

  // Restore saved meeting on mount or check query params
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("action") === "ingest") {
          setShowIngestModal(true);
        } else if (params.get("action") === "meeting") {
          setMeetingScheduleModal(true);
        }

        const saved = localStorage.getItem("ordermind_scheduled_meeting_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.title) {
            setScheduledMeeting(parsed);
            const dismissed = localStorage.getItem("ordermind_meeting_dismissed_v3");
            if (dismissed !== "true") {
              setShowMeetingBanner(true);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Live real-time notification monitor: fires sound, desktop notification & toast when meeting time arrives
  React.useEffect(() => {
    if (!scheduledMeeting.meetingDateTime || scheduledMeeting.notified || meetingStatus === "completed") {
      return;
    }

    const interval = setInterval(() => {
      const target = new Date(scheduledMeeting.meetingDateTime).getTime();
      const now = Date.now();

      if (!isNaN(target) && now >= target) {
        // 1. Play synthesized bell chime
        playNotificationChime();

        // 2. Browser Desktop Notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(`🔔 Client Meeting Alert: ${scheduledMeeting.title || "Scheduled Meeting"}`, {
              body: `Meeting with ${scheduledMeeting.clientName || "Client"} (${scheduledMeeting.company || ""}) is starting now!`,
              icon: "/favicon.ico",
            });
          } catch {
            // Notification error fallback
          }
        }

        // 3. In-App Toaster Alert
        toast.info(
          `🔔 Live Meeting Starting Now! "${scheduledMeeting.title || "Meeting"}" with ${scheduledMeeting.clientName || "Client"}`,
          {
            duration: 25000,
            action: scheduledMeeting.phone
              ? {
                  label: "Call Client",
                  onClick: () => {
                    if (typeof window !== "undefined") {
                      window.open(`tel:${scheduledMeeting.phone}`);
                    }
                  },
                }
              : undefined,
          }
        );

        // 4. Update state to notified
        setMeetingStatus("in_progress");
        setScheduledMeeting((prev) => {
          const updated = { ...prev, notified: true };
          try {
            localStorage.setItem("ordermind_scheduled_meeting_v3", JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
        setShowMeetingBanner(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledMeeting, meetingStatus, playNotificationChime]);



  // Selected Client for Live Inspector (Right Panel)
  const [selectedInspector, setSelectedInspector] = React.useState<SelectedInspectorClient | null>(null);

  const [isEditingSpecs, setIsEditingSpecs] = React.useState(false);
  const [editableSpecs, setEditableSpecs] = React.useState({
    productStructure: "",
    quantity: "",
    dimensions: "",
    material: "",
  });

  React.useEffect(() => {
    if (selectedInspector) {
      setEditableSpecs({
        productStructure: selectedInspector.productStructure || "",
        quantity: selectedInspector.quantity || "",
        dimensions: selectedInspector.dimensions || "",
        material: selectedInspector.material || "",
      });
      setIsEditingSpecs(false);
    }
  }, [selectedInspector]);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workspace/home");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load workspace data");
      }
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleProcessDump = async () => {
    if (!pastedChat.trim()) {
      toast.error("Please paste or load a chat export script");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/inbox/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: ingestingClientName.trim() || "Customer",
          rawChat: pastedChat.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to process and upload details");
      }
      const json = await res.json();
      toast.success(
        json.orderNumber
          ? `Uploaded & extracted specs! Order #${json.orderNumber} created for ${json.clientName}`
          : `Chat uploaded for ${json.clientName}!`
      );
      setShowIngestModal(false);
      setPastedChat("");
      
      // Immediately refresh workspace dashboard so new client and order counts show up everywhere
      await fetchDashboardData();

      if (json.orderId) {
        router.push(`/orders/${json.orderId}`);
      } else {
        router.push(`/inbox?conversationId=${json.conversationId || ""}`);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to upload details");
    } finally {
      setIsProcessing(false);
    }
  };

  // Dynamically compute live customer feeds from database data?.activeClientFeeds
  const visibleClientFeeds = React.useMemo(() => {
    if (!data?.activeClientFeeds || data.activeClientFeeds.length === 0) {
      return [];
    }
    const q = searchQuery.toLowerCase().trim();
    return data.activeClientFeeds
      .filter((cf) => {
        if (!q) return true;
        return (
          cf.clientName.toLowerCase().includes(q) ||
          (cf.company && cf.company.toLowerCase().includes(q)) ||
          (cf.lastMessageContent && cf.lastMessageContent.toLowerCase().includes(q))
        );
      })
      .map((cf) => {
        const initials =
          cf.clientName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "CL";
        return {
          id: cf.clientId || `feed_${cf.conversationId || Date.now()}`,
          name: cf.clientName,
          role: "Client Partner",
          company: cf.company || cf.clientName,
          avatar: initials,
          avatarBg: "bg-lime-100 text-lime-950 border-lime-300",
          channels: ["WhatsApp", "Chat"],
          specsCount: cf.activeOrdersCount > 0 ? 5 : 0,
          category: "⚡ Needs Review",
          product: "Packaging Order",
          qty: "Custom Units",
          dims: "Custom Specs",
          mat: "Specification Board",
          orderId: cf.conversationId,
        };
      });
  }, [data?.activeClientFeeds, searchQuery]);

  // Dynamically compute urgent packaging tasks from real database data?.needsAttentionQueue
  const urgentTasks = React.useMemo(() => {
    const list = data?.needsAttentionQueue || [];
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.clientName.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (taskFilter === "Completed") return completedTaskIds.has(item.id);
      if (taskFilter === "Due Today") return !completedTaskIds.has(item.id);
      if (taskFilter === "Overdue") return item.urgencyLevel === "critical";
      return true;
    });
  }, [data?.needsAttentionQueue, searchQuery, taskFilter, completedTaskIds]);

  // Live Clock & Timezone State (Indian Standard Time / Asia/Kolkata)
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatted = React.useMemo(() => {
    if (!currentTime) return "4:15 PM";
    return currentTime.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  const scheduleNextTime = React.useMemo(() => {
    if (!currentTime) return "4:45 PM";
    const next = new Date(currentTime.getTime() + 30 * 60 * 1000);
    return next.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  const scheduleLaterTime = React.useMemo(() => {
    if (!currentTime) return "5:30 PM";
    const later = new Date(currentTime.getTime() + 75 * 60 * 1000);
    return later.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  return (
    <AppShell title="Workspace">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* 1. TOP FLOATING STATUS & SCHEDULE BAR                                     */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-2.5 w-full flex-wrap">
          {/* Left: WORKSPACE Title & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black font-display tracking-tight text-slate-900 uppercase">
              WORKSPACE
            </h1>
            <button
              onClick={() => setShowIngestModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-tactile transition-transform hover:scale-[1.02] flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Order Chat</span>
            </button>
            <button
              onClick={() => router.push("/orders?action=create")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-xs transition cursor-pointer"
              title="Create a new packaging order directly"
            >
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span>+ Direct Order</span>
            </button>
            <button
              onClick={() => setMeetingScheduleModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span>Schedule Meeting</span>
            </button>
          </div>

          {/* Center: Dynamic Island Schedule Capsule */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0C0E14] text-white border border-white/10 shadow-xl backdrop-blur-xl text-xs font-mono flex-shrink-0">
            <span className="text-white/60 font-semibold text-[11px]">Schedule</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>IST (UTC+5:30)</span>
            </div>
            <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-bold text-[8px] flex items-center justify-center">
              AS
            </div>
            <span className="text-white/80 font-bold text-[10px]">Live</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-brand-lime text-slate-950 font-bold text-[10px]">
                {timeFormatted}
              </span>
              <span className="text-white/30 text-[9px]">●</span>
              <span className="text-white/80 font-medium text-[10px]">{scheduleNextTime} (Dieline)</span>
              <span className="text-white/30 text-[9px]">●</span>
              <span className="text-white/50 text-[10px]">{scheduleLaterTime}</span>
            </div>
            <button
              onClick={() => router.push("/orders")}
              className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center ml-0.5 transition"
            >
              <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Right: Metrics & User Profile Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => router.push("/orders")}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-xs font-mono font-bold text-slate-900 whitespace-nowrap transition cursor-pointer"
              title="View all production orders"
            >
              <span>{data?.pipelineStats?.totalActive || 6}</span>
              <span className="text-slate-500 font-sans font-medium text-[11px]">Orders</span>
              <span className="text-emerald-600 bg-emerald-50 px-1 rounded text-[9px]">+3</span>
            </button>

            <button
              onClick={() => router.push("/orders?status=CONFIRMED")}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-xs font-mono font-bold text-slate-900 whitespace-nowrap transition cursor-pointer"
              title="View confirmed production-ready orders"
            >
              <span>{data?.pipelineStats?.totalConfirmed || 2}</span>
              <span className="text-slate-500 font-sans font-medium text-[11px]">Confirmed</span>
              <span className="text-emerald-600 bg-emerald-50 px-1 rounded text-[9px]">+2</span>
            </button>

            <button
              onClick={() => router.push("/orders?status=NEEDS_REVIEW")}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-xs font-mono font-bold text-slate-900 whitespace-nowrap transition cursor-pointer"
              title="View orders needing operator review"
            >
              <span>{data?.needsAttentionQueue?.length || 2}</span>
              <span className="text-slate-500 font-sans font-medium text-[11px]">Review</span>
              <span className="text-amber-600 bg-amber-50 px-1 rounded text-[9px]">!1</span>
            </button>

            <button
              onClick={() => {
                if (!scheduledMeeting.title) {
                  setMeetingScheduleModal(true);
                  toast.info("No active meeting scheduled yet. Please enter meeting details to schedule.");
                } else {
                  try {
                    localStorage.removeItem("ordermind_meeting_dismissed_v3");
                  } catch {}
                  setShowMeetingBanner(true);
                  toast.info("Meeting notification banner displayed");
                }
              }}
              className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              title="Toggle meeting alert banner"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-bold text-slate-900 whitespace-nowrap">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-950 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center">
                IK
              </div>
              <span className="text-[10px] sm:text-[11px] truncate max-w-[100px] sm:max-w-[130px]">InTheBox Studio</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PERSISTENT TOP MEETING NOTIFICATION BANNER                                */}
        {/* ========================================================================= */}
        {showMeetingBanner && scheduledMeeting.title && (
          <div className="p-4 rounded-3xl bg-[#0C0E14] text-white border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-2 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-brand-lime text-slate-950 font-black font-display text-sm flex items-center justify-center shadow-tactile flex-shrink-0">
                  <Calendar className="w-5 h-5 stroke-[2.5]" />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-extrabold text-sm text-white truncate">
                      {scheduledMeeting.title}
                    </span>
                    {scheduledMeeting.notified && meetingStatus !== "completed" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-black animate-pulse flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>🔔 LIVE NOW / TIME REACHED</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-brand-lime/20 text-brand-lime border border-brand-lime/30 font-mono text-[10px] font-bold">
                        {scheduledMeeting.time || "Scheduled"}
                      </span>
                    )}
                    {meetingStatus === "completed" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold">
                        ✓ Completed
                      </span>
                    )}
                    {meetingStatus === "rescheduled" && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono text-[10px] font-bold">
                        ⏰ Rescheduled
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/70 flex items-center gap-2 flex-wrap font-sans">
                    <span>Client: <strong className="text-white">{scheduledMeeting.clientName || "Client"}</strong> {scheduledMeeting.company ? `(${scheduledMeeting.company})` : ""}</span>
                    {scheduledMeeting.phone && (
                      <>
                        <span>&bull;</span>
                        <span className="font-mono text-white/60">{scheduledMeeting.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Selector & Quick Action Controls */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Interactive Status Dropdown */}
                <select
                  value={meetingStatus}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setMeetingStatus(val);
                    if (val === "rescheduled") {
                      setRescheduleModalOpen(true);
                    } else {
                      toast.success(`Meeting status updated to: ${val.replace("_", " ").toUpperCase()}`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-lime cursor-pointer"
                >
                  <option value="waiting" className="bg-slate-900 text-white">🟡 Scheduled / Waiting</option>
                  <option value="in_progress" className="bg-slate-900 text-white">🔴 Live / In Progress</option>
                  <option value="completed" className="bg-slate-900 text-white">🟢 Completed</option>
                  <option value="rescheduled" className="bg-slate-900 text-white">🔵 Rescheduled (Pick Time)</option>
                </select>

                {/* Direct Phone Call */}
                {scheduledMeeting.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(`tel:${scheduledMeeting.phone}`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-tactile transition flex items-center gap-1.5 cursor-pointer"
                    title="Direct Phone Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>
                )}

                {/* WhatsApp Chat */}
                {scheduledMeeting.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      const cleanPhone = scheduledMeeting.phone.replace(/[^0-9]/g, "");
                      window.open(`https://wa.me/${cleanPhone}`, "_blank");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs shadow-tactile transition flex items-center gap-1.5 cursor-pointer"
                    title="Chat on WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                )}

                {/* Open Direct Chat Button */}
                <button
                  type="button"
                  onClick={() => router.push(`/inbox?client=${encodeURIComponent(scheduledMeeting.company || scheduledMeeting.clientName)}`)}
                  className="px-3 py-1.5 rounded-xl bg-brand-lime hover:bg-brand-limeHover text-slate-950 font-bold text-xs shadow-tactile transition flex items-center gap-1.5 cursor-pointer"
                  title="Open client chat in Inbox"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>

                {/* View Order / Specs */}
                {scheduledMeeting.orderId && (
                  <button
                    type="button"
                    onClick={() => router.push(`/orders/${scheduledMeeting.orderId}`)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Specs</span>
                  </button>
                )}

                {/* Copy Phone */}
                {scheduledMeeting.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(scheduledMeeting.phone);
                      toast.success(`Copied phone: ${scheduledMeeting.phone}`);
                    }}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                    title="Copy client phone number"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Dismiss Button - Persists in localStorage */}
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem("ordermind_meeting_dismissed_v3", "true");
                    } catch {}
                    setShowMeetingBanner(false);
                    toast.info("Meeting notification dismissed. Click the bell icon on the top right to restore it anytime.");
                  }}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-white/50 hover:text-white flex items-center justify-center transition cursor-pointer ml-1"
                  title="Close notification banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smart Overdue / Time Elapsed Prompt */}
            {meetingStatus !== "completed" && meetingStatus !== "rescheduled" && scheduledMeeting.notified && (
              <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-500/10 -mx-4 -mb-4 p-3 rounded-b-3xl border-t border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-sans">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Meeting time reached ({scheduledMeeting.time}).</strong> Is this session completed or would you like to reschedule?
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMeetingStatus("completed");
                      toast.success("Meeting marked as COMPLETED! Status updated.");
                    }}
                    className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Mark Completed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRescheduleModalOpen(true)}
                    className="px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MAIN 2-COLUMN LAYOUT                                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================================= */}
          {/* LEFT COLUMN: Active Customer Feeds + Packaging Tasks (7 Cols)           */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* --------------------------------------------------------------------- */}
            {/* CARD 1: Active Customer Feeds                                         */}
            {/* --------------------------------------------------------------------- */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-display text-slate-900">
                    Active Customer Feeds
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                    {visibleClientFeeds.length} Ingested
                  </span>
                </div>

                {/* Action Buttons: + New Order Chat, + Direct Order & + Add New Customer */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowIngestModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-tactile transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ New Order Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/orders?action=create")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-xs transition cursor-pointer"
                    title="Directly initialize an order in Orders matrix without chat"
                  >
                    <Package className="w-3.5 h-3.5 text-slate-600" />
                    <span>+ Direct Order</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-lime hover:bg-brand-limeHover border border-[#BDE82B] text-slate-950 font-bold text-xs shadow-tactile transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>+ Add New Customer</span>
                  </button>
                </div>
              </div>

              {/* Customer Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {visibleClientFeeds.length === 0 ? (
                  <div className="col-span-full p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                    <Package className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="font-bold text-xs text-slate-800">No active customer feeds yet</div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Import a customer chat or click &quot;+ Direct Order&quot; to initialize a customer pipeline.
                    </p>
                  </div>
                ) : (
                  visibleClientFeeds.map((feed) => {
                    const isSelected = selectedInspector?.name === feed.name;
                    return (
                      <div
                        key={feed.id}
                        onClick={() =>
                          setSelectedInspector({
                            id: feed.id,
                            name: feed.name,
                            company: feed.company,
                            avatar: feed.avatar,
                            title: `${feed.company} Packaging Brief`,
                            productStructure: feed.product,
                            quantity: feed.qty,
                            dimensions: feed.dims,
                            material: feed.mat,
                            orderId: feed.orderId,
                            documents: [
                              { name: "ProductionBrief.pdf", type: "pdf", badge: "Brief v1" },
                              { name: "DielineCut_70mm.pdf", type: "cad", badge: "CAD Dieline" },
                            ],
                          })
                        }
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group",
                          isSelected
                            ? "bg-slate-50 border-slate-900 shadow-md ring-1 ring-slate-900"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl font-bold font-display text-xs flex items-center justify-center border",
                              feed.avatarBg
                            )}
                          >
                            {feed.avatar}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/inbox?client=${encodeURIComponent(feed.company || feed.name)}`);
                            }}
                            className="w-6 h-6 rounded-full text-slate-400 group-hover:text-slate-900 flex items-center justify-center transition hover:bg-slate-200"
                            title={`Open ${feed.company || feed.name} chat in Inbox`}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-0.5">
                          <h3 className="font-bold text-xs text-slate-900 truncate">
                            {feed.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate">{feed.role}</p>
                        </div>

                        {/* Interactive Channels */}
                        <div className="flex flex-wrap gap-1">
                          {feed.channels.map((ch) => (
                            <button
                              key={ch}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const param = encodeURIComponent(feed.company || feed.name);
                                router.push(`/inbox?client=${param}`);
                              }}
                              className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                              title={`Open ${ch} conversation`}
                            >
                              {ch}
                            </button>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <div className="flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          </div>
                          <span className="font-bold text-slate-700">{feed.specsCount} Specs</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* CARD 2: Your Day's Packaging Tasks                                   */}
            {/* --------------------------------------------------------------------- */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-display text-slate-900">
                    Your Day&apos;s Packaging Tasks
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                    {urgentTasks.length} Tasks
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[170px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono"
                    />
                  </div>
                  {["All", "Due Today", "Overdue", "Completed"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer",
                        taskFilter === tab
                          ? "bg-slate-950 text-white font-bold shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {urgentTasks.length === 0 ? (
                  <div className="col-span-full p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <div className="font-bold text-xs text-slate-800">No pending packaging tasks</div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      All orders and customer tasks are up to date. Direct orders or imported conversations requiring review will appear here automatically.
                    </p>
                  </div>
                ) : (
                  urgentTasks.map((task) => {
                    const isCompleted = completedTaskIds.has(task.id);
                    const isPinned = pinnedTaskIds.has(task.id);
                    const isReminded = remindedTaskIds.has(task.id);

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "p-5 rounded-3xl border shadow-soft space-y-4 flex flex-col justify-between transition-all",
                          task.urgencyLevel === "critical"
                            ? "bg-red-50/50 border-red-200"
                            : isPinned
                            ? "bg-amber-50/40 border-amber-200"
                            : "bg-white border-slate-200"
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-display">
                                {task.clientName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900">{task.clientName}</div>
                                <div className="text-[10px] text-slate-500 font-medium">Order #{task.orderNumber}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <button
                                type="button"
                                onClick={() => {
                                  setRemindedTaskIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(task.id)) {
                                      next.delete(task.id);
                                      toast.info("Task reminder turned off");
                                    } else {
                                      next.add(task.id);
                                      toast.success(`Reminder set for: ${task.title}`);
                                    }
                                    return next;
                                  });
                                }}
                                className={cn(
                                  "p-1 rounded-full hover:bg-slate-100 transition cursor-pointer",
                                  isReminded && "text-emerald-700"
                                )}
                                title="Set reminder notification"
                              >
                                <Bell className={cn("w-3.5 h-3.5", isReminded && "fill-emerald-700 text-emerald-700")} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPinnedTaskIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(task.id)) {
                                      next.delete(task.id);
                                      toast.info("Task unpinned");
                                    } else {
                                      next.add(task.id);
                                      toast.success("Task pinned to top!");
                                    }
                                    return next;
                                  });
                                }}
                                className={cn(
                                  "p-1 rounded-full hover:bg-slate-100 transition cursor-pointer",
                                  isPinned && "text-amber-600"
                                )}
                                title="Pin task to top"
                              >
                                <Pin className={cn("w-3.5 h-3.5", isPinned && "fill-amber-600 text-amber-600")} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletedTaskIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(task.id)) {
                                      next.delete(task.id);
                                      toast.info("Task marked in progress");
                                    } else {
                                      next.add(task.id);
                                      toast.success("Task completed!");
                                    }
                                    return next;
                                  });
                                }}
                                className="cursor-pointer transition hover:scale-110 flex-shrink-0"
                                title="Mark task completed"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-400 hover:border-slate-800" />
                                )}
                              </button>
                              <span
                                className={cn(
                                  "font-bold text-xs text-slate-900 transition-all",
                                  isCompleted && "line-through opacity-50"
                                )}
                              >
                                {task.title}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "text-[11px] text-slate-500 pl-6 line-clamp-2",
                                isCompleted && "line-through opacity-50"
                              )}
                            >
                              {task.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <button
                            onClick={() => router.push(task.actionUrl)}
                            className="px-3.5 py-1.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <span>{task.actionLabel}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => router.push(`/inbox?client=${encodeURIComponent(task.clientName)}`)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                            title={`Open ${task.clientName} chat`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}


              </div>
            </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT COLUMN: Dark Glassmorphic Focus / Live Inspector Panel (5 Cols)   */}
          {/* ======================================================================= */}
          <div className="lg:col-span-5">
            <div className="p-7 rounded-3xl bg-[#0C0E14] text-white border border-white/10 shadow-2xl backdrop-blur-xl space-y-6">
              {/* Header: Live Operator Sync */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse shadow-[0_0_8px_#CCFF00]" />
                  <span className="text-xs font-mono font-bold tracking-wide text-white/90 uppercase">
                    Live Operator Sync
                  </span>
                </div>
                <button
                  onClick={() => router.push("/settings")}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Live Inspector Content or Empty State */}
              {!selectedInspector ? (
                <div className="py-20 px-6 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-white">No Client Selected</h3>
                    <p className="text-xs text-white/50 max-w-xs leading-relaxed font-sans">
                      Select any customer feed or urgent task card on the left to inspect packaging specifications, CAD proofs, and production briefs in real time.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Client Profile Card */}
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-brand-lime text-slate-950 font-extrabold font-display text-sm flex items-center justify-center shadow-tactile flex-shrink-0">
                        {selectedInspector.avatar || selectedInspector.name?.slice(0, 2).toUpperCase() || "CL"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-white truncate">
                          {selectedInspector.name}
                        </h3>
                        <p className="text-xs text-white/60 truncate font-sans">
                          {selectedInspector.title || selectedInspector.company}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          const phone = selectedInspector.phone || "";
                          if (phone) {
                            navigator.clipboard.writeText(phone);
                            toast.success(`WhatsApp: Copied ${phone}`);
                          } else {
                            toast.info("No phone number registered for this client");
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                        title="Copy customer WhatsApp phone number"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const email = selectedInspector.email || "";
                          if (email) {
                            navigator.clipboard.writeText(email);
                            toast.success(`Email: Copied ${email}`);
                          } else {
                            toast.info("No email address registered for this client");
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                        title="Copy customer Email address"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const ig = selectedInspector.instagram || "";
                          if (ig) {
                            navigator.clipboard.writeText(ig);
                            toast.success(`Instagram: Copied handle ${ig}`);
                          } else {
                            toast.info("No Instagram handle registered for this client");
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                        title="Copy customer Instagram handle"
                      >
                        <Instagram className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const clientParam = encodeURIComponent(selectedInspector.name || selectedInspector.company || "");
                          router.push(`/inbox?client=${clientParam}`);
                        }}
                        className="w-8 h-8 rounded-full bg-brand-lime text-slate-950 font-bold hover:bg-brand-limeHover flex items-center justify-center transition shadow-tactile cursor-pointer"
                        title="Open customer conversation in Inbox"
                      >
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Summary & Spec Customizer Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white uppercase tracking-wider">
                        Packaging Specification
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingSpecs) {
                            setSelectedInspector((prev) => (prev ? {
                              ...prev,
                              productStructure: editableSpecs.productStructure,
                              quantity: editableSpecs.quantity,
                              dimensions: editableSpecs.dimensions,
                              material: editableSpecs.material,
                            } : null));
                            setIsEditingSpecs(false);
                            toast.success("Packaging specifications saved in workspace!");
                          } else {
                            setIsEditingSpecs(true);
                          }
                        }}
                        className="text-brand-lime hover:underline text-[11px] font-bold font-mono"
                      >
                        {isEditingSpecs ? "✓ Save Specs" : "✎ Edit Specs"}
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="flex items-center justify-between py-1.5 border-b border-white/5 gap-2">
                        <span className="text-white/60 whitespace-nowrap">Product Structure:</span>
                        {isEditingSpecs ? (
                          <input
                            type="text"
                            value={editableSpecs.productStructure}
                            onChange={(e) =>
                              setEditableSpecs((prev) => ({ ...prev, productStructure: e.target.value }))
                            }
                            className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-brand-lime"
                          />
                        ) : (
                          <span className="font-bold text-white text-right">
                            {selectedInspector.productStructure || "Standard Packaging"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-1.5 border-b border-white/5 gap-2">
                        <span className="text-white/60 whitespace-nowrap">Total Quantity:</span>
                        {isEditingSpecs ? (
                          <input
                            type="text"
                            value={editableSpecs.quantity}
                            onChange={(e) =>
                              setEditableSpecs((prev) => ({ ...prev, quantity: e.target.value }))
                            }
                            className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-brand-lime text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-brand-lime"
                          />
                        ) : (
                          <span className="font-bold text-brand-lime text-right">
                            {selectedInspector.quantity || "—"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-1.5 border-b border-white/5 gap-2">
                        <span className="text-white/60 whitespace-nowrap">Dimensions:</span>
                        {isEditingSpecs ? (
                          <input
                            type="text"
                            value={editableSpecs.dimensions}
                            onChange={(e) =>
                              setEditableSpecs((prev) => ({ ...prev, dimensions: e.target.value }))
                            }
                            className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-brand-lime"
                          />
                        ) : (
                          <span className="font-bold text-white text-right font-mono">
                            {selectedInspector.dimensions || "—"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-1.5 border-b border-white/5 gap-2">
                        <span className="text-white/60 whitespace-nowrap">Material Substrate:</span>
                        {isEditingSpecs ? (
                          <input
                            type="text"
                            value={editableSpecs.material}
                            onChange={(e) =>
                              setEditableSpecs((prev) => ({ ...prev, material: e.target.value }))
                            }
                            className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-brand-lime"
                          />
                        ) : (
                          <span className="font-bold text-white text-right">
                            {selectedInspector.material || "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documents & Briefs Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white uppercase tracking-wider">
                        Documents &amp; Proofs
                      </span>
                      <button
                        onClick={() => router.push("/orders")}
                        className="text-brand-lime hover:underline text-[11px] font-bold"
                      >
                        View All
                      </button>
                    </div>

                    {selectedInspector.documents && selectedInspector.documents.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        {selectedInspector.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              if (doc.name.includes("Brief") && selectedInspector.orderId) {
                                router.push(`/orders/${selectedInspector.orderId}/brief`);
                              } else {
                                toast.success(`Opening document preview for ${selectedInspector.name}`);
                              }
                            }}
                            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-lime/40 transition flex flex-col justify-between space-y-2 cursor-pointer hover:bg-white/10 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-white/90 group-hover:bg-brand-lime group-hover:text-slate-950 transition">
                                {doc.badge}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.success(`Downloaded ${doc.name}`);
                                }}
                                className="text-white/60 hover:text-white"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="font-mono text-xs text-white/90 truncate font-semibold">
                              {doc.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/50 font-mono">
                        No files or proofs uploaded yet
                      </div>
                    )}
                  </div>

                  {/* Active Production Stage & Brief Actions */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-brand-lime font-bold text-xs font-mono">
                        <Sparkles className="w-4 h-4" />
                        <span>Active Production Stage</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold font-mono">
                        Pre-Press Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                      Deterministic claim pipeline verified specifications against customer conversation thread.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedInspector.orderId) {
                            router.push(`/orders/${selectedInspector.orderId}`);
                          } else {
                            router.push("/orders");
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-brand-lime hover:bg-brand-limeHover text-slate-950 font-bold text-xs shadow-tactile transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Package className="w-4 h-4 stroke-[2.5]" />
                        <span>{selectedInspector.orderId ? "View Order & Specifications →" : "View Orders →"}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NEW ORDER CHAT / INGESTION MODAL                                       */}
      {/* ========================================================================= */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-lime text-slate-950 flex items-center justify-center font-bold shadow-sm">
                  <UploadCloud className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Ingest WhatsApp Chat Export
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Paste raw WhatsApp text exports, voice note transcriptions, or load a sample chat.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIngestModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1-Click Samples */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase block">
                ⚡ 1-Click Test Scenarios:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {sampleChats.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPastedChat(s.text);
                      setIngestingClientName(s.client);
                      toast.info(`Loaded scenario: ${s.client}`);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-xs font-medium text-slate-800 transition truncate"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-700 block font-bold mb-1">
                  Client / Brand Name:
                </label>
                <input
                  type="text"
                  value={ingestingClientName}
                  onChange={(e) => setIngestingClientName(e.target.value)}
                  placeholder="Client or brand entity"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 block font-bold mb-1">
                  Raw Chat Transcript (.txt / paste WhatsApp messages):
                </label>
                <textarea
                  rows={6}
                  value={pastedChat}
                  onChange={(e) => setPastedChat(e.target.value)}
                  placeholder="Paste [Date, Time] Name: Message content here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                />
              </div>
            </div>

            {/* Direct Order Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
              <span>Have a walk-in or manual order without a chat transcript?</span>
              <button
                type="button"
                onClick={() => {
                  setShowIngestModal(false);
                  router.push("/orders?action=create");
                }}
                className="font-bold text-slate-900 underline hover:text-slate-700 cursor-pointer flex items-center gap-1"
              >
                <span>Initialize Direct Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessDump}
                disabled={isProcessing || !pastedChat.trim()}
                className="px-6 py-2.5 rounded-full bg-brand-lime hover:bg-brand-limeHover border border-[#BDE82B] text-slate-950 font-bold text-xs shadow-tactile flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading Details &amp; Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SCHEDULE CLIENT MEETING MODAL                                          */}
      {/* ========================================================================= */}
      {meetingScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-lime text-slate-950 flex items-center justify-center font-bold shadow-sm">
                  <Calendar className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Schedule Client Meeting
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Real-time meeting alert with desktop notification &amp; audio reminder.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMeetingScheduleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Client Auto-Fill (Optional Helper) */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase font-mono">
                  ⚡ Quick Pick Client (Optional):
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {visibleClientFeeds.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setScheduledMeeting((prev) => ({
                        ...prev,
                        clientName: c.name,
                        company: c.company,
                        phone: c.phone || "",
                        orderId: c.orderId || "",
                      }));
                      toast.info(`Filled details for ${c.name} (${c.company})`);
                    }}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-200 border border-slate-200 text-slate-800 text-[11px] font-medium transition cursor-pointer shadow-2xs"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="text-slate-700 block font-bold mb-1">
                  Meeting Title / Agenda: *
                </label>
                <input
                  type="text"
                  value={scheduledMeeting.title}
                  onChange={(e) => setScheduledMeeting((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Rigid Box Dieline Approval"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block font-bold mb-1">
                    Client Name:
                  </label>
                  <input
                    type="text"
                    value={scheduledMeeting.clientName}
                    onChange={(e) => setScheduledMeeting((prev) => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Client contact name"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block font-bold mb-1">
                    Company / Brand:
                  </label>
                  <input
                    type="text"
                    value={scheduledMeeting.company}
                    onChange={(e) => setScheduledMeeting((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Brand or company name"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Time Presets */}
              <div className="space-y-1.5">
                <label className="text-slate-700 block font-bold">
                  Scheduled Time &amp; Notification Alarm: *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { label: "+1 Min (Test Alert)", mins: 1 },
                    { label: "+15 Mins", mins: 15 },
                    { label: "+1 Hour", mins: 60 },
                    { label: "+24 Hours", mins: 1440 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const target = new Date(Date.now() + preset.mins * 60 * 1000);
                        const yr = target.getFullYear();
                        const mo = String(target.getMonth() + 1).padStart(2, "0");
                        const da = String(target.getDate()).padStart(2, "0");
                        const hr = String(target.getHours()).padStart(2, "0");
                        const mi = String(target.getMinutes()).padStart(2, "0");
                        const dtLocal = `${yr}-${mo}-${da}T${hr}:${mi}`;
                        const timeStr = target.toLocaleTimeString("en-IN", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                        const dateStr = target.toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        });
                        setScheduledMeeting((prev) => ({
                          ...prev,
                          meetingDateTime: dtLocal,
                          time: `${dateStr} at ${timeStr} IST`,
                          notified: false,
                        }));
                        toast.info(`Time set: ${preset.label} (${timeStr} IST)`);
                      }}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold text-center transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block font-bold mb-1">
                    Pick Exact Date &amp; Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledMeeting.meetingDateTime}
                    onChange={(e) => {
                      const dt = e.target.value;
                      if (!dt) {
                        setScheduledMeeting((prev) => ({ ...prev, meetingDateTime: "", time: "", notified: false }));
                        return;
                      }
                      const target = new Date(dt);
                      const timeStr = target.toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                      const dateStr = target.toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      });
                      setScheduledMeeting((prev) => ({
                        ...prev,
                        meetingDateTime: dt,
                        time: `${dateStr} at ${timeStr} IST`,
                        notified: false,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block font-bold mb-1">
                    Client Phone Number:
                  </label>
                  <input
                    type="text"
                    value={scheduledMeeting.phone}
                    onChange={(e) => setScheduledMeeting((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +91 98201 44589"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {scheduledMeeting.time && (
                <div className="p-2.5 rounded-xl bg-lime-50 border border-lime-200 text-lime-900 text-[11px] font-sans flex items-center gap-2">
                  <Check className="w-4 h-4 text-lime-700 shrink-0" />
                  <span>
                    Notification scheduled for: <strong>{scheduledMeeting.time}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setMeetingScheduleModal(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!scheduledMeeting.title.trim()) {
                    toast.error("Please enter a meeting title / agenda");
                    return;
                  }
                  if (!scheduledMeeting.time && !scheduledMeeting.meetingDateTime) {
                    toast.error("Please select a scheduled meeting time or preset");
                    return;
                  }

                  // Request browser desktop notification permission if supported
                  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                    Notification.requestPermission();
                  }

                  setShowMeetingBanner(true);
                  setMeetingStatus("waiting");
                  setMeetingScheduleModal(false);

                  try {
                    localStorage.setItem(
                      "ordermind_scheduled_meeting_v3",
                      JSON.stringify({ ...scheduledMeeting, notified: false })
                    );
                    localStorage.removeItem("ordermind_meeting_dismissed_v3");
                  } catch {
                    // ignore
                  }

                  toast.success(
                    `Meeting scheduled for ${scheduledMeeting.time}! Live reminder alarm armed.`
                  );
                }}
                className="px-6 py-2.5 rounded-full bg-brand-lime hover:bg-brand-limeHover border border-[#BDE82B] text-slate-950 font-bold text-xs shadow-tactile flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save &amp; Pin Meeting</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. QUICK RESCHEDULE MEETING MODAL                                         */}
      {/* ========================================================================= */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                  <Clock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Reschedule Meeting Slot
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Pick a new date/time for <strong>{scheduledMeeting.title || "Meeting"}</strong> with {scheduledMeeting.clientName || "Client"}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Time Presets */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase block">
                ⚡ Quick Time Presets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "+1 Min (Test Alert)", mins: 1 },
                  { label: "Tomorrow at 11:00 AM IST", mins: 1440 },
                  { label: "Tomorrow at 3:30 PM IST", mins: 1710 },
                  { label: "Next Monday at 2:00 PM IST", mins: 4320 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const target = new Date(Date.now() + preset.mins * 60 * 1000);
                      const yr = target.getFullYear();
                      const mo = String(target.getMonth() + 1).padStart(2, "0");
                      const da = String(target.getDate()).padStart(2, "0");
                      const hr = String(target.getHours()).padStart(2, "0");
                      const mi = String(target.getMinutes()).padStart(2, "0");
                      const dtLocal = `${yr}-${mo}-${da}T${hr}:${mi}`;
                      const timeStr = target.toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                      const dateStr = target.toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      });
                      const formatted = `${dateStr} at ${timeStr} IST`;
                      setRescheduleCustomTime(formatted);
                      setScheduledMeeting((prev) => ({
                        ...prev,
                        meetingDateTime: dtLocal,
                        time: formatted,
                        notified: false,
                      }));
                      toast.info(`Selected time: ${formatted}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                      rescheduleCustomTime === preset.label || scheduledMeeting.time === preset.label
                        ? "bg-slate-950 text-white font-bold border-slate-950 shadow-xs"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Time Input */}
            <div className="space-y-2 text-xs font-mono">
              <label className="text-slate-700 block font-bold">
                Or Type Custom Time &amp; Date:
              </label>
              <input
                type="text"
                value={rescheduleCustomTime}
                onChange={(e) => setRescheduleCustomTime(e.target.value)}
                placeholder="e.g. Wednesday Oct 7 at 4:00 PM IST"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const newTime = rescheduleCustomTime || scheduledMeeting.time;
                  if (!newTime) {
                    toast.error("Please pick a reschedule time");
                    return;
                  }
                  setScheduledMeeting((prev) => {
                    const updated = {
                      ...prev,
                      time: newTime,
                      notified: false,
                    };
                    try {
                      localStorage.setItem("ordermind_scheduled_meeting_v3", JSON.stringify(updated));
                      localStorage.removeItem("ordermind_meeting_dismissed_v3");
                    } catch {
                      // ignore
                    }
                    return updated;
                  });
                  setMeetingStatus("waiting");
                  setRescheduleModalOpen(false);
                  setShowMeetingBanner(true);
                  toast.success(`Meeting successfully rescheduled to: ${newTime}! Real-time reminder armed.`);
                }}
                className="px-6 py-2.5 rounded-full bg-brand-lime hover:bg-brand-limeHover border border-[#BDE82B] text-slate-950 font-bold text-xs shadow-tactile flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm Reschedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ADD NEW CUSTOMER MODAL                                                 */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-lime text-slate-950 font-bold flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Add New Customer
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Save phone number, email ID, and Instagram handle for quick messaging.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCustName.trim() || !newCustCompany.trim()) {
                  toast.error("Please enter customer and company name");
                  return;
                }
                setIsSubmittingCustomer(true);
                try {
                  const res = await fetch("/api/clients", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: newCustName.trim(),
                      company: newCustCompany.trim(),
                      phone: newCustPhone.trim() || undefined,
                      email: newCustEmail.trim() || undefined,
                      instagram: newCustInstagram.trim() || undefined,
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to add customer");
                  }
                  toast.success(`Customer "${newCustName}" created successfully!`);
                  setShowAddCustomerModal(false);
                  setNewCustName("");
                  setNewCustCompany("");
                  setNewCustPhone("");
                  setNewCustEmail("");
                  setNewCustInstagram("");
                  await fetchDashboardData();
                } catch (err: unknown) {
                  toast.error((err as Error).message || "Failed to add customer");
                } finally {
                  setIsSubmittingCustomer(false);
                }
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div>
                <label className="text-slate-700 block font-bold mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Primary contact name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block font-bold mb-1">Company / Brand Entity *</label>
                <input
                  type="text"
                  required
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  placeholder="Brand or company name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block font-bold mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+91 00000 00000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block font-bold mb-1">Email ID</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block font-bold mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={newCustInstagram}
                  onChange={(e) => setNewCustInstagram(e.target.value)}
                  placeholder="@brand_packaging"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomer || !newCustName.trim() || !newCustCompany.trim()}
                  className="px-6 py-2.5 rounded-full bg-brand-lime hover:bg-brand-limeHover border border-[#BDE82B] text-slate-950 font-bold text-xs shadow-tactile flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSubmittingCustomer ? "Saving..." : "Save Customer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}


