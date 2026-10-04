"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Settings,
  Shield,
  UserCheck,
  Brain,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Info,
  Clock,
  Zap,
  Users,
  Mail,
  Phone,
  UserPlus,
  Activity,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CompanyBrain, BrainPriceEntry, BrainService } from "@/server/db/schema";

interface WorkspaceInfo {
  id: string;
  name: string;
  industry: string;
  role: string;
}

interface KeyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface TeamMember {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
  createdAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"brain" | "general">("brain");
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Brain State
  const [brain, setBrain] = useState<CompanyBrain | null>(null);
  const [isLoadingBrain, setIsLoadingBrain] = useState(true);
  const [isSavingBrain, setIsSavingBrain] = useState(false);
  const [isResettingBrain, setIsResettingBrain] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Key Contacts in Company Brain
  const [contacts, setContacts] = useState<KeyContact[]>([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRole, setNewContactRole] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");

  // Team Dashboard Access
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"OWNER" | "ADMIN" | "OPERATOR">("OPERATOR");
  const [inviting, setInviting] = useState(false);

  // New item inputs
  const [newMaterial, setNewMaterial] = useState("");
  const [newFinish, setNewFinish] = useState("");
  const [newAccessory, setNewAccessory] = useState("");
  const [newPolicy, setNewPolicy] = useState("");
  const [newOutOfScope, setNewOutOfScope] = useState("");

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/workspace/members");
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch {
      //
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const newContact: KeyContact = {
      id: `contact_${Date.now()}`,
      name: newContactName.trim(),
      role: newContactRole.trim() || "Operations",
      phone: newContactPhone.trim(),
      email: newContactEmail.trim() || "",
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    try {
      localStorage.setItem("ordermind_brain_contacts", JSON.stringify(updated));
    } catch {}
    setNewContactName("");
    setNewContactRole("");
    setNewContactPhone("");
    setNewContactEmail("");
    toast.success("Contact saved successfully");
  };

  const handleRemoveContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    try {
      localStorage.setItem("ordermind_brain_contacts", JSON.stringify(updated));
    } catch {}
    toast.info("Contact removed");
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || inviteEmail.split("@")[0],
          role: inviteRole,
        }),
      });
      if (res.ok) {
        toast.success(`Member invited: ${inviteEmail}`);
        setInviteEmail("");
        setInviteName("");
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to invite member");
      }
    } catch {
      toast.error("Network error inviting member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/workspace/members?id=${encodeURIComponent(memberId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.info("Member access removed");
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("Network error removing member");
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeWorkspace) setWorkspace(data.activeWorkspace);
        if (data.user) {
          setUserName(data.user.name);
          setUserEmail(data.user.email);
        }
      });

    try {
      const stored = localStorage.getItem("ordermind_brain_contacts");
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch {}

    loadBrain();
    fetchMembers();
  }, []);

  const loadBrain = async () => {
    setIsLoadingBrain(true);
    try {
      const res = await fetch("/api/company-brain");
      if (res.ok) {
        const data = await res.json();
        setBrain(data.brain);
      }
    } catch (err) {
      console.error("Failed to load brain", err);
    } finally {
      setIsLoadingBrain(false);
    }
  };

  const handleSaveBrain = async () => {
    if (!brain) return;
    setIsSavingBrain(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/company-brain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: brain.services,
          priceTable: brain.priceTable,
          materials: brain.materials,
          finishes: brain.finishes,
          accessories: brain.accessories,
          policies: brain.policies,
          outOfScope: brain.outOfScope,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBrain(data.brain);
        setSaveStatus("Company Brain saved successfully.");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save Company Brain");
      }
    } catch {
      alert("Network error while saving Company Brain");
    } finally {
      setIsSavingBrain(false);
    }
  };

  const handleResetBrain = async () => {
    if (!confirm("Reset all Company Brain services, prices, and rules to InTheBox packaging standards?")) {
      return;
    }
    setIsResettingBrain(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/company-brain/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBrain(data.brain);
        setSaveStatus("Company Brain reset to InTheBox standards.");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch {
      alert("Failed to reset Company Brain");
    } finally {
      setIsResettingBrain(false);
    }
  };

  const updatePriceEntry = (index: number, priceINR: number | null, notes: string) => {
    if (!brain) return;
    const updated = [...brain.priceTable];
    updated[index] = { ...updated[index], priceINR, notes };
    setBrain({ ...brain, priceTable: updated });
  };

  const addArrayItem = (key: "materials" | "finishes" | "accessories" | "policies" | "outOfScope", value: string, clearFn: () => void) => {
    if (!brain || !value.trim()) return;
    const current = brain[key] || [];
    if (!current.includes(value.trim())) {
      setBrain({ ...brain, [key]: [...current, value.trim()] });
    }
    clearFn();
  };

  const removeArrayItem = (key: "materials" | "finishes" | "accessories" | "policies" | "outOfScope", index: number) => {
    if (!brain) return;
    const updated = [...(brain[key] || [])];
    updated.splice(index, 1);
    setBrain({ ...brain, [key]: updated });
  };

  return (
    <AppShell title="Settings">
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-canvas min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted block font-semibold">
              Packaging Operating System
            </span>
            <h1 className="text-display-sm font-display font-extrabold text-ink tracking-tight mt-0.5">
              Workspace Settings
            </h1>
            <p className="text-body-xs text-ink-muted mt-1 max-w-xl">
              Configure your Company Brain catalogue, deterministic pricing rules, and workspace profile.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-surface border border-border rounded-xl shadow-soft">
            <button
              onClick={() => setActiveTab("brain")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "brain"
                  ? "bg-brand-lime text-ink shadow-sm font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-muted"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Company Brain</span>
            </button>
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "general"
                  ? "bg-brand-lime text-ink shadow-sm font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-muted"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>General &amp; Profile</span>
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className="p-3 bg-brand-lime/10 border border-brand-lime/30 rounded-xl text-ink text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1F8A4C]" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* TAB 1: COMPANY BRAIN */}
        {activeTab === "brain" && (
          <div className="space-y-8">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border bg-surface shadow-soft">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-lime/15 border border-brand-lime/30 text-ink">
                  <Brain className="w-5 h-5 text-brand-limeDark" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-body-sm font-display font-bold text-ink">InTheBox Company Brain</h2>
                    <span className="px-2 py-0.5 rounded-full bg-surface-muted border border-border font-mono text-[10px] text-ink-muted">
                      v{brain?.version || 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Deterministic pricing, packaging substrates, foiling, and production stage-gate constraints.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetBrain}
                  disabled={isResettingBrain || isLoadingBrain}
                  className="text-xs flex items-center gap-1.5 text-ink-muted hover:text-ink"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveBrain}
                  disabled={isSavingBrain || isLoadingBrain}
                  className="text-xs flex items-center gap-1.5 bg-brand-lime text-ink font-bold shadow-tactile border border-brand-limeHover hover:bg-brand-limeHover"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingBrain ? "Saving..." : "Save Brain"}</span>
                </Button>
              </div>
            </div>

            {/* 1. Deterministic Price Table */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-lime" />
                    <span>Deterministic Price Table (INR)</span>
                  </h3>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Consultation &amp; Design have fixed rates. Manufacturing orders strictly require quotes (NEEDS_QUOTE).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border text-ink-muted font-mono text-[11px]">
                      <th className="py-2.5 px-3">Service Tier</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Price (INR)</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Rules &amp; Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {brain?.priceTable.map((item, idx) => (
                      <tr key={item.tierId} className="hover:bg-surface-muted/30">
                        <td className="py-2 px-3 font-semibold text-ink">{item.name}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold ${
                              item.category === "consultation"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : item.category === "design"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {item.category === "manufacturing" ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 font-mono text-[11px] font-bold">
                              NEEDS_QUOTE
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 font-mono">
                              <span className="text-ink-muted">₹</span>
                              <input
                                type="number"
                                value={item.priceINR ?? ""}
                                onChange={(e) =>
                                  updatePriceEntry(
                                    idx,
                                    e.target.value === "" ? null : Number(e.target.value),
                                    item.notes || ""
                                  )
                                }
                                className="w-24 px-2 py-1 bg-surface rounded border border-border text-ink font-semibold focus:outline-none focus:ring-1 focus:ring-brand-lime"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-ink-muted">{item.billingUnit}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.notes || ""}
                            onChange={(e) =>
                              updatePriceEntry(idx, item.priceINR, e.target.value)
                            }
                            className="w-full px-2 py-1 bg-surface rounded border border-border text-ink-muted text-xs focus:outline-none focus:ring-1 focus:ring-brand-lime"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Substrates & Materials */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-lime" />
                <span>Substrates &amp; Paper Materials</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {brain?.materials.map((mat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-muted border border-border text-ink text-xs"
                  >
                    <span>{mat}</span>
                    <button
                      onClick={() => removeArrayItem("materials", idx)}
                      className="text-ink-muted hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md pt-2">
                <input
                  type="text"
                  placeholder="e.g. 400 GSM Grey Board"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-brand-lime"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addArrayItem("materials", newMaterial, () => setNewMaterial(""))}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* 3. Finishes & Foiling */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-lime" />
                <span>Surface Finishes &amp; Foiling</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {brain?.finishes.map((fin, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-muted border border-border text-ink text-xs"
                  >
                    <span>{fin}</span>
                    <button
                      onClick={() => removeArrayItem("finishes", idx)}
                      className="text-ink-muted hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md pt-2">
                <input
                  type="text"
                  placeholder="e.g. Rose Gold Foil Stamping"
                  value={newFinish}
                  onChange={(e) => setNewFinish(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-brand-lime"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addArrayItem("finishes", newFinish, () => setNewFinish(""))}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* 4. Accessories & Inserts */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-lime" />
                <span>Inserts &amp; Accessories</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {brain?.accessories.map((acc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-muted border border-border text-ink text-xs"
                  >
                    <span>{acc}</span>
                    <button
                      onClick={() => removeArrayItem("accessories", idx)}
                      className="text-ink-muted hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md pt-2">
                <input
                  type="text"
                  placeholder="e.g. Molded Pulp Insert"
                  value={newAccessory}
                  onChange={(e) => setNewAccessory(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-brand-lime"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addArrayItem("accessories", newAccessory, () => setNewAccessory(""))}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* 5. Production Policies & Out-of-Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policies */}
              <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-3">
                <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-lime" />
                  <span>Production Stage-Gate Policies</span>
                </h3>
                <ul className="space-y-2 text-xs text-ink-muted">
                  {brain?.policies.map((pol, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-2 p-2 bg-surface-muted rounded-lg border border-border/60">
                      <span>{pol}</span>
                      <button
                        onClick={() => removeArrayItem("policies", idx)}
                        className="text-ink-muted hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="New policy requirement"
                    value={newPolicy}
                    onChange={(e) => setNewPolicy(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-brand-lime"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addArrayItem("policies", newPolicy, () => setNewPolicy(""))}
                    className="text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Out of Scope */}
              <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-3">
                <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Out of Scope (Disallowed)</span>
                </h3>
                <ul className="space-y-2 text-xs text-ink-muted">
                  {brain?.outOfScope.map((scope, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-2 p-2 bg-amber-50/50 border border-amber-200/50 text-amber-900 rounded-lg">
                      <span>{scope}</span>
                      <button
                        onClick={() => removeArrayItem("outOfScope", idx)}
                        className="text-ink-muted hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Disallowed request or service"
                    value={newOutOfScope}
                    onChange={(e) => setNewOutOfScope(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-brand-lime"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addArrayItem("outOfScope", newOutOfScope, () => setNewOutOfScope(""))}
                    className="text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Key Team & Vendor Contacts Directory */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                <div>
                  <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-lime" />
                    <span>Team &amp; Vendor Key Contacts</span>
                  </h3>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Save key estimator, production manager, and dieline vendor phone numbers for instant access.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-ink-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
                  {contacts.length} Contacts Saved
                </span>
              </div>

              {/* Add Contact Form */}
              <form onSubmit={handleAddContact} className="p-4 rounded-xl bg-surface-muted/40 border border-border/80 space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                  Add Contact Person
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Contact Name *"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Sourcing Lead)"
                    value={newContactRole}
                    onChange={(e) => setNewContactRole(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Phone Number *"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="text-xs font-semibold bg-brand-lime hover:bg-brand-limeHover text-ink shadow-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Save Contact</span>
                  </Button>
                </div>
              </form>

              {/* Contacts List */}
              {contacts.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-ink-muted">
                  No key contacts saved yet. Use the form above to add vendor leads or internal managers.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {contacts.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-surface border border-border space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-ink">{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveContact(c.id)}
                            className="text-ink-muted hover:text-red-500"
                            title="Remove contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-ink-muted block">{c.role}</span>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-border/60 text-[11px] font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-ink font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{c.phone}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(c.phone);
                              toast.success(`Copied phone: ${c.phone}`);
                            }}
                            className="text-[10px] text-ink-muted hover:text-ink underline"
                          >
                            Copy
                          </button>
                        </div>
                        {c.email && (
                          <div className="text-ink-muted text-[10px] truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GENERAL & PROFILE */}
        
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Workspace Details */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-body-xs font-display font-bold text-ink">
                <Settings className="w-4 h-4 text-brand-lime" />
                <span>Packaging Hub Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-xs pt-1">
                <div>
                  <label className="text-[11px] font-mono text-ink-muted block mb-1">Business Name</label>
                  <input
                    type="text"
                    disabled
                    value={workspace?.name || "InTheBox Packaging"}
                    className="w-full px-3 py-2 rounded-xl bg-surface-muted/60 border border-border text-ink font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-ink-muted block mb-1">Industry Scope</label>
                  <input
                    type="text"
                    disabled
                    value={workspace?.industry || "Packaging & Box Manufacturing"}
                    className="w-full px-3 py-2 rounded-xl bg-surface-muted/60 border border-border text-ink font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-ink-muted block mb-1">Workspace ID (Tenant Key)</label>
                  <input
                    type="text"
                    disabled
                    value={workspace?.id || "N/A"}
                    className="w-full px-3 py-2 rounded-xl bg-surface-muted/60 border border-border text-ink-subtle font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-ink-muted block mb-1">Membership Role</label>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-lime/20 border border-brand-lime/40 text-ink font-mono text-xs font-bold">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{workspace?.role || "OWNER"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Account */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-body-xs font-display font-bold text-ink">
                <Shield className="w-4 h-4 text-[#1F8A4C]" />
                <span>Authenticated Operator Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-xs pt-1">
                <div>
                  <label className="text-[11px] font-mono text-ink-muted block mb-1">Operator Name</label>
                  <input
                    type="text"
                    disabled
                    value={userName || "Operator"}
                    className="w-full px-3 py-2 rounded-xl bg-surface-muted/60 border border-border text-ink font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-ink-muted block mb-1">Operator Email</label>
                  <input
                    type="text"
                    disabled
                    value={userEmail || "operator@ordermind.pack"}
                    className="w-full px-3 py-2 rounded-xl bg-surface-muted/60 border border-border text-ink font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Team Dashboard Access & Invitations */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                <div>
                  <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-brand-lime" />
                    <span>Team Member Access &amp; Invitations</span>
                  </h3>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Grant other team members and operators access to this dashboard with their email ID.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-ink-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
                  {members.length} Members
                </span>
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInviteMember} className="p-4 rounded-xl bg-surface-muted/40 border border-border/80 space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                  Add User Access
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="email"
                    required
                    placeholder="User Email ID *"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Full Name (Optional)"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs outline-none"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs outline-none font-mono"
                  >
                    <option value="OPERATOR">Role: OPERATOR</option>
                    <option value="ADMIN">Role: ADMIN</option>
                    <option value="OWNER">Role: OWNER</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={inviting}
                    size="sm"
                    className="text-xs font-semibold bg-brand-lime hover:bg-brand-limeHover text-ink shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>{inviting ? "Adding..." : "Grant Dashboard Access"}</span>
                  </Button>
                </div>
              </form>

              {/* Members List */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border text-ink-muted font-mono text-[11px]">
                      <th className="py-2.5 px-3">Team Member</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs font-mono text-ink-muted">
                          No additional members invited yet.
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-muted/30 font-sans">
                          <td className="py-2.5 px-3 font-semibold text-ink">{m.name}</td>
                          <td className="py-2.5 px-3 font-mono text-ink-muted text-[11px]">{m.email}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-brand-lime/20 border border-brand-lime/40 text-ink font-mono text-[10px] font-bold">
                              {m.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                              Active
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {m.role !== "OWNER" && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-ink-muted hover:text-red-500 font-mono text-[11px]"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sentry & Observability Diagnostics */}
            <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-body-xs font-display font-bold text-ink flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-lime" />
                    <span>Observability &amp; Sentry Diagnostics</span>
                  </h3>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Distributed error tracing, Gemma AI pipeline telemetry, and system health status.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/sentry-example-page"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-lime hover:bg-brand-limeHover text-ink font-bold text-xs shadow-tactile transition"
                  >
                    <span>Test Diagnostic Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href="https://goelsahhab-workspace.sentry.io/issues/?project=javascript-nextjs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-muted text-ink font-semibold text-xs shadow-soft transition"
                  >
                    <span>Sentry Issues</span>
                    <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-surface-muted/50 rounded-xl border border-border">
                  <span className="text-[10px] font-mono text-ink-muted uppercase block">Workspace</span>
                  <span className="font-semibold text-ink font-mono text-xs">goelsahhab-workspace</span>
                </div>
                <div className="p-3 bg-surface-muted/50 rounded-xl border border-border">
                  <span className="text-[10px] font-mono text-ink-muted uppercase block">Sentry Project</span>
                  <span className="font-semibold text-ink font-mono text-xs">javascript-nextjs</span>
                </div>
                <div className="p-3 bg-surface-muted/50 rounded-xl border border-border">
                  <span className="text-[10px] font-mono text-ink-muted uppercase block">Agent Tracing</span>
                  <span className="font-semibold text-emerald-700 font-mono text-xs">Active (@sentry/nextjs)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
