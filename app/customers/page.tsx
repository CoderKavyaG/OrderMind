"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Users,
  Plus,
  Phone,
  Mail,
  Building,
  X,
  Search,
  Instagram,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  SlidersHorizontal,
  Package,
  MessageSquare,
  DollarSign,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Client, CustomerMemoryDoc, MemoryKind } from "@/server/db/schema";
import { cn } from "@/lib/utils";

export default function CustomersPage() {
  const [clients, setClients] = useState<Array<Client & { id: string }>>([]);
  const [memories, setMemories] = useState<Array<CustomerMemoryDoc & { id: string; customerName?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "MEMORY" | "ACTIVE">("ALL");

  // Modals
  const [createClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [createMemoryModalOpen, setCreateMemoryModalOpen] = useState(false);
  const [selectedClientForMemory, setSelectedClientForMemory] = useState<string>("");

  // Create Client Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [company, setCompany] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [requirements, setRequirements] = useState("");
  const [submittingClient, setSubmittingClient] = useState(false);

  // Create Memory Form
  const [factText, setFactText] = useState("");
  const [memoryKind, setMemoryKind] = useState<MemoryKind>("preference");
  const [isMemoryVerified, setIsMemoryVerified] = useState(true);
  const [submittingMemory, setSubmittingMemory] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsRes, memRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/memory"),
      ]);

      if (clientsRes.ok) {
        const cData = await clientsRes.json();
        setClients(cData.clients || []);
      }
      if (memRes.ok) {
        const mData = await memRes.json();
        setMemories(mData.memories || []);
      }
    } catch {
      toast.error("Failed to load customer & memory hub data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmittingClient(true);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, phone, email, instagram, requirements, tags }),
      });

      const data = await res.json();
      if (data.client) {
        setClients((prev) => [data.client, ...prev]);
        setCreateClientModalOpen(false);
        setName("");
        setCompany("");
        setPhone("");
        setEmail("");
        setInstagram("");
        setTagsInput("");
        setRequirements("");
        toast.success(`Client "${data.client.name}" created`);
      } else {
        toast.error(data.error || "Failed to create client");
      }
    } catch {
      toast.error("Error creating client");
    } finally {
      setSubmittingClient(false);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForMemory || !factText.trim()) return;

    setSubmittingMemory(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedClientForMemory,
          fact: factText.trim(),
          kind: memoryKind,
          verified: isMemoryVerified,
        }),
      });

      if (res.ok) {
        setCreateMemoryModalOpen(false);
        setFactText("");
        toast.success("Added customer memory rule");
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save memory");
      }
    } catch {
      toast.error("Error creating memory");
    } finally {
      setSubmittingMemory(false);
    }
  };

  const handleToggleMemoryVerify = async (memId: string, currentVerified: boolean) => {
    try {
      const res = await fetch(`/api/memory/${memId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !currentVerified }),
      });
      if (res.ok) {
        toast.success(currentVerified ? "Unverified rule" : "Verified rule");
        loadData();
      }
    } catch {
      toast.error("Error updating memory status");
    }
  };

  const handleDeleteMemory = async (memId: string) => {
    if (!confirm("Delete this learned memory rule?")) return;
    try {
      const res = await fetch(`/api/memory/${memId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Memory rule deleted");
        loadData();
      }
    } catch {
      toast.error("Error deleting memory");
    }
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q);
    return matchesSearch;
  });

  const totalRevenue = clients.reduce((acc, c) => acc + ((c as any).lifetimeValue || 0), 0);
  const totalOrders = clients.reduce((acc, c) => acc + ((c as any).orderCount || 0), 0);

  return (
    <AppShell title="Customer & Memory Hub">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                Unified Portfolio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-lime/20 text-slate-900 border border-brand-lime/40 text-[10px] font-mono font-bold">
                CUSTOMERS &amp; MEMORY
              </span>
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 mt-0.5">
              Customer &amp; Memory Hub
            </h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Commercial client accounts unified with learned substrate preferences, repeat sizing shorthands, and order histories.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (clients.length > 0) setSelectedClientForMemory(clients[0].id);
                setCreateMemoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-bold shadow-xs transition"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Add Memory Rule</span>
            </button>

            <button
              onClick={() => setCreateClientModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold shadow-tactile transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ New Client Profile</span>
            </button>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block">
              Active Clients
            </span>
            <span className="text-xl font-black font-display text-slate-900 mt-0.5 block">
              {clients.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block">
              Learned Memory Rules
            </span>
            <span className="text-xl font-black font-display text-indigo-600 mt-0.5 block">
              {memories.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block">
              Lifetime Production Revenue
            </span>
            <span className="text-xl font-black font-display text-emerald-600 mt-0.5 block">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block">
              Total Processed Orders
            </span>
            <span className="text-xl font-black font-display text-slate-900 mt-0.5 block">
              {totalOrders} Runs
            </span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, company, email, specifications..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {["ALL", "ACTIVE", "MEMORY"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold transition",
                  activeTab === tab
                    ? "bg-slate-950 text-white font-bold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                )}
              >
                {tab === "ALL" ? "All Profiles" : tab === "ACTIVE" ? "Active Accounts" : "Learned Memory Rules"}
              </button>
            ))}
          </div>
        </div>

        {/* Clients & Memory Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-slate-500">
            Loading Customer &amp; Memory Hub...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-display font-bold text-sm text-slate-900">No client profiles found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a new client profile or ingest a WhatsApp chat to automatically populate packaging accounts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              // Match memories for this client
              const clientMemories = memories.filter(
                (m) => m.customerId === client.id || m.customerName === client.name
              );

              return (
                <div
                  key={client.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft hover:shadow-tactile transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Client Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-brand-lime text-slate-950 font-extrabold font-display text-sm flex items-center justify-center border border-[#BDE82B] shadow-sm">
                          {client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{client.name}</h3>
                          {client.company && (
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {client.company}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                        ACTIVE
                      </span>
                    </div>

                    {/* Contact Badges (Phone, Email, Instagram) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                      {client.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(client.phone || "");
                            toast.success(`Copied phone: ${client.phone}`);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface border border-border text-ink hover:bg-surface-muted transition"
                          title="Click to copy phone"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{client.phone}</span>
                        </button>
                      )}
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface border border-border text-ink hover:bg-surface-muted transition"
                          title="Click to send email"
                        >
                          <Mail className="w-3 h-3 text-blue-600" />
                          <span className="truncate max-w-[140px]">{client.email}</span>
                        </a>
                      )}
                      {client.instagram && (
                        <a
                          href={client.instagram.startsWith("http") ? client.instagram : `https://instagram.com/${client.instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface border border-border text-ink hover:bg-surface-muted transition"
                          title="Open Instagram Profile"
                        >
                          <Instagram className="w-3 h-3 text-pink-600" />
                          <span>{client.instagram.startsWith("@") ? client.instagram : `@${client.instagram}`}</span>
                        </a>
                      )}
                    </div>

                    {/* Commercial Stats */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Lifetime Revenue
                        </span>
                        <span className="font-bold text-slate-900">
                          ₹{((client as any).lifetimeValue || 450000).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Orders Run
                        </span>
                        <span className="font-bold text-slate-900">
                          {(client as any).orderCount || 4} Orders
                        </span>
                      </div>
                    </div>

                    {/* Packaging Substrate Specs */}
                    {((client as any).requirements || (client as any).notes) && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                          Preferred Packaging Spec
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          {(client as any).requirements || (client as any).notes}
                        </p>
                      </div>
                    )}

                    {/* Learned Memory Rules */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3" />
                          <span>Learned Rules ({clientMemories.length})</span>
                        </span>
                        <button
                          onClick={() => {
                            setSelectedClientForMemory(client.id);
                            setCreateMemoryModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-slate-600 hover:text-slate-900 underline font-mono"
                        >
                          + Add Rule
                        </button>
                      </div>

                      {clientMemories.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic font-mono">
                          No shorthand rules recorded yet.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {clientMemories.slice(0, 3).map((mem) => (
                            <div
                              key={mem.id}
                              className="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100/80 text-[11px] text-slate-800 flex items-start justify-between gap-2"
                            >
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 inline-block mr-1">
                                  {mem.kind}
                                </span>
                                <span>{mem.fact}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteMemory(mem.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      href={`/inbox?client=${encodeURIComponent(client.name)}`}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold text-xs transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat Thread</span>
                    </Link>

                    <Link
                      href={`/orders?clientId=${client.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-950 text-white hover:bg-slate-900 font-bold text-xs shadow-xs transition"
                    >
                      <span>Orders Matrix</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================================= */}
        {/* ADD MEMORY MODAL                                                        */}
        {/* ======================================================================= */}
        {createMemoryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Add Learned Memory Rule
                  </h3>
                </div>
                <button
                  onClick={() => setCreateMemoryModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-slate-700 block font-bold mb-1">Target Client:</label>
                  <select
                    value={selectedClientForMemory}
                    onChange={(e) => setSelectedClientForMemory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block font-bold mb-1">
                    Learned Fact / Shorthand Rule:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={factText}
                    onChange={(e) => setFactText(e.target.value)}
                    placeholder="e.g. 'Same as last time' refers to 300 GSM Matte SBS board from order ORD-0099..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 block font-bold mb-1">Rule Kind:</label>
                    <select
                      value={memoryKind}
                      onChange={(e) => setMemoryKind(e.target.value as MemoryKind)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                    >
                      <option value="preference">Preference</option>
                      <option value="shorthand">Shorthand</option>
                      <option value="pattern">Pattern</option>
                    </select>
                  </div>

                  <div className="pt-5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="memVerify"
                      checked={isMemoryVerified}
                      onChange={(e) => setIsMemoryVerified(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <label htmlFor="memVerify" className="text-xs font-bold text-slate-900">
                      Verified Rule
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCreateMemoryModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMemory || !factText.trim()}
                    className="px-5 py-2 rounded-full bg-slate-950 text-white font-bold text-xs shadow-tactile hover:bg-slate-900 disabled:opacity-50"
                  >
                    {submittingMemory ? "Saving..." : "Save Memory Rule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* CREATE CLIENT MODAL                                                     */}
        {/* ======================================================================= */}
        {createClientModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Create Client Account
                </h3>
                <button
                  onClick={() => setCreateClientModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-slate-700 block font-bold mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Primary contact name"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block font-bold mb-1">Company / Brand Entity *</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Brand or company name"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 block font-bold mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 00000 00000"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block font-bold mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@brand.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 block font-bold mb-1">Instagram Handle / Profile</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@brand_packaging"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block font-bold mb-1">Packaging Requirements / Notes</label>
                  <textarea
                    rows={2}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="e.g. 350 GSM White SBS board with gold foil stamping and EVA foam tray..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCreateClientModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClient || !name.trim()}
                    className="px-5 py-2 rounded-full bg-slate-950 text-white font-bold text-xs shadow-tactile hover:bg-slate-900 disabled:opacity-50"
                  >
                    {submittingClient ? "Creating..." : "Create Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
