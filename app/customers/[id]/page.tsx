"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Users,
  Building,
  Package,
  Phone,
  Mail,
  Instagram,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  Sparkles,
  StickyNote,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  X,
  Upload,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type {
  Client,
  Brand,
  ProductSku,
  CustomerMemoryDoc,
  Note,
  OrderDoc,
  Conversation,
} from "@/server/db/schema";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();

  const [client, setClient] = useState<(Client & { id: string }) | null>(null);
  const [brands, setBrands] = useState<Array<Brand & { id: string }>>([]);
  const [skusByBrand, setSkusByBrand] = useState<Record<string, Array<ProductSku & { id: string }>>>({});
  const [memories, setMemories] = useState<Array<CustomerMemoryDoc & { id: string }>>([]);
  const [notes, setNotes] = useState<Array<Note & { id: string }>>([]);
  const [orders, setOrders] = useState<Array<OrderDoc & { id: string }>>([]);
  const [conversations, setConversations] = useState<Array<Conversation & { id: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "overview" | "conversations" | "orders" | "memory" | "notes" | "files"
  >("overview");

  // Modals
  const [isEditClientModal, setIsEditClientModal] = useState(false);
  const [isAddBrandModal, setIsAddBrandModal] = useState(false);
  const [isAddSkuModal, setIsAddSkuModal] = useState<string | null>(null); // brandId
  const [isAddMemoryModal, setIsAddMemoryModal] = useState(false);
  const [isAddNoteModal, setIsAddNoteModal] = useState(false);

  // Form states
  const [clientForm, setClientForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    instagram: "",
    notes: "",
    tags: "",
  });

  const [brandForm, setBrandForm] = useState({ name: "", notes: "" });
  const [skuForm, setSkuForm] = useState({
    name: "",
    structure: "Rigid Box w/ Magnetic Flap",
    dimensions: "200 x 140 x 90 mm",
    materials: "350 GSM Kappa Board",
    finish: "Matte Lamination + Gold Foil",
    accessories: "Custom EVA Foam Insert",
  });

  const [memoryForm, setMemoryForm] = useState({
    fact: "",
    kind: "preference" as "preference" | "shorthand" | "pattern" | "rule",
    verified: false,
    brandId: "",
  });

  const [noteContent, setNoteContent] = useState("");
  const [notePinned, setNotePinned] = useState(false);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [uploadingSkuId, setUploadingSkuId] = useState<string | null>(null);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const [cRes, bRes, mRes, nRes, oRes, convRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/brands?clientId=${clientId}`),
        fetch(`/api/memory?customerId=${clientId}`),
        fetch(`/api/notes?scope=client&targetId=${clientId}`),
        fetch(`/api/orders`),
        fetch(`/api/inbox/conversations`),
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setClient(cData.client);
        setClientForm({
          name: cData.client.name,
          company: cData.client.company || "",
          phone: cData.client.phone || "",
          email: cData.client.email || "",
          instagram: cData.client.instagram || "",
          notes: cData.client.notes || "",
          tags: (cData.client.tags || []).join(", "),
        });
      }

      if (bRes.ok) {
        const bData = await bRes.json();
        setBrands(bData.brands || []);
        // Load SKUs for each brand
        const skusMap: Record<string, Array<ProductSku & { id: string }>> = {};
        for (const b of bData.brands || []) {
          const sRes = await fetch(`/api/products?brandId=${b.id}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            skusMap[b.id] = sData.products || [];
          }
        }
        setSkusByBrand(skusMap);
      }

      if (mRes.ok) {
        const mData = await mRes.json();
        setMemories(mData.memories || []);
      }

      if (nRes.ok) {
        const nData = await nRes.json();
        setNotes(nData.notes || []);
      }

      if (oRes.ok) {
        const oData = await oRes.json();
        const clientOrders = (oData.orders || []).filter(
          (o: OrderDoc) => o.customerId === clientId
        );
        setOrders(clientOrders);
      }

      if (convRes.ok) {
        const convData = await convRes.json();
        const clientConvs = (convData.conversations || []).filter(
          (c: Conversation) => c.customerId === clientId
        );
        setConversations(clientConvs);
      }
    } catch {
      toast.error("Failed to load client profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  // Handlers
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clientForm,
          tags: clientForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setIsEditClientModal(false);
        toast.success("Client profile updated");
      }
    } catch {
      toast.error("Failed to update client");
    }
  };

  const handleToggleArchive = async () => {
    if (!client) return;
    const nextStatus = !client.archived;
    // Optimistic UI
    setClient({ ...client, archived: nextStatus });
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: nextStatus }),
      });
      if (res.ok) {
        toast.success(nextStatus ? "Client archived" : "Client unarchived");
      } else {
        setClient({ ...client, archived: !nextStatus });
        toast.error("Failed to update archive status");
      }
    } catch {
      setClient({ ...client, archived: !nextStatus });
      toast.error("Network error");
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim()) return;

    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name: brandForm.name,
          notes: brandForm.notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBrands((prev) => [...prev, data.brand]);
        setSkusByBrand((prev) => ({ ...prev, [data.brand.id]: [] }));
        setIsAddBrandModal(false);
        setBrandForm({ name: "", notes: "" });
        toast.success(`Brand "${data.brand.name}" created`);
      }
    } catch {
      toast.error("Failed to create brand");
    }
  };

  const handleCreateSku = async (e: React.FormEvent, brandId: string) => {
    e.preventDefault();
    if (!skuForm.name.trim()) return;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          ...skuForm,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSkusByBrand((prev) => ({
          ...prev,
          [brandId]: [...(prev[brandId] || []), data.product],
        }));
        setIsAddSkuModal(null);
        setSkuForm({
          name: "",
          structure: "Rigid Box w/ Magnetic Flap",
          dimensions: "200 x 140 x 90 mm",
          materials: "350 GSM Kappa Board",
          finish: "Matte Lamination + Gold Foil",
          accessories: "Custom EVA Foam Insert",
        });
        toast.success(`SKU "${data.product.name}" created`);
      }
    } catch {
      toast.error("Failed to create SKU");
    }
  };

  const handleUploadPhoto = async (brandId: string, skuId: string, file: File) => {
    setUploadingSkuId(skuId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const photoObj = {
          id: data.attachment.id,
          name: data.attachment.filename,
          url: `/api/attachments/${data.attachment.id}`,
        };

        // Update SKU
        const currentSkus = skusByBrand[brandId] || [];
        const target = currentSkus.find((s) => s.id === skuId);
        const nextPhotos = [...(target?.photos || []), photoObj];

        const patchRes = await fetch(`/api/products/${skuId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photos: nextPhotos }),
        });

        if (patchRes.ok) {
          const patchData = await patchRes.json();
          setSkusByBrand((prev) => ({
            ...prev,
            [brandId]: prev[brandId].map((s) => (s.id === skuId ? patchData.product : s)),
          }));
          toast.success("Photo attached to SKU");
        }
      }
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploadingSkuId(null);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryForm.fact.trim()) return;

    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: clientId,
          fact: memoryForm.fact,
          kind: memoryForm.kind,
          verified: memoryForm.verified,
          brandId: memoryForm.brandId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [data.memory, ...prev]);
        setIsAddMemoryModal(false);
        setMemoryForm({ fact: "", kind: "preference", verified: false, brandId: "" });
        toast.success("Memory saved");
      }
    } catch {
      toast.error("Failed to create memory");
    }
  };

  const handleToggleVerifyMemory = async (memoryId: string, current: boolean) => {
    // Optimistic UI
    setMemories((prev) =>
      prev.map((m) => (m.id === memoryId ? { ...m, verified: !current } : m))
    );
    try {
      const res = await fetch(`/api/memory/${memoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !current }),
      });
      if (res.ok) {
        toast.success(!current ? "Memory verified" : "Memory unverified");
      } else {
        setMemories((prev) =>
          prev.map((m) => (m.id === memoryId ? { ...m, verified: current } : m))
        );
      }
    } catch {
      setMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? { ...m, verified: current } : m))
      );
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm("Delete this memory fact?")) return;
    setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    try {
      await fetch(`/api/memory/${memoryId}`, { method: "DELETE" });
      toast.success("Memory deleted");
    } catch {
      toast.error("Failed to delete memory");
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "client",
          targetId: clientId,
          content: noteContent,
          pinned: notePinned,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => (data.note.pinned ? [data.note, ...prev] : [...prev, data.note]));
        setIsAddNoteModal(false);
        setNoteContent("");
        setNotePinned(false);
        toast.success("Note added");
      }
    } catch {
      toast.error("Failed to create note");
    }
  };

  const handleTogglePinNote = async (noteId: string, current: boolean) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, pinned: !current } : n))
    );
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !current }),
      });
      toast.success(!current ? "Note pinned" : "Note unpinned");
    } catch {
      //
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (loading || !client) {
    return (
      <AppShell title="Client Details">
        <div className="p-8 text-center text-ink-muted font-mono text-sm">
          Loading client profile...
        </div>
      </AppShell>
    );
  }

  // Collect all photos from all SKUs for the Files tab
  const allPhotos = Object.values(skusByBrand).flatMap((skus) =>
    skus.flatMap((s) => (s.photos || []).map((p) => ({ ...p, skuName: s.name })))
  );

  return (
    <AppShell title={client.name}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-canvas min-h-screen">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients Directory
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
              className="text-xs gap-1.5"
            >
              {client.archived ? (
                <>
                  <ArchiveRestore className="w-3.5 h-3.5" />
                  <span>Restore Client</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive Client</span>
                </>
              )}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditClientModal(true)}
              className="text-xs font-semibold gap-1.5 bg-brand-lime text-ink shadow-tactile border border-brand-limeHover"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Client</span>
            </Button>
          </div>
        </div>

        {/* Client Header Card */}
        <div className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lime/20 border border-brand-lime/40 text-ink font-display font-extrabold text-lg">
                {client.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-display-xs font-display font-bold text-ink">
                    {client.name}
                  </h1>
                  {client.archived && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-mono text-[10px] font-bold uppercase">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-body-xs text-ink-muted flex items-center gap-3 mt-1">
                  {client.company && (
                    <span className="flex items-center gap-1 font-semibold text-ink">
                      <Building className="w-3.5 h-3.5 text-ink-muted" />
                      {client.company}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-ink-muted" />
                      {client.phone}
                    </span>
                  )}
                  {client.instagram && (
                    <span className="flex items-center gap-1 font-mono">
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                      {client.instagram}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {client.tags?.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-surface-muted border border-border font-mono text-xs text-ink-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Overview & Brands", icon: Building },
            { id: "conversations", label: `Conversations (${conversations.length})`, icon: MessageSquare },
            { id: "orders", label: `Orders (${orders.length})`, icon: Package },
            { id: "memory", label: `Memory Bank (${memories.length})`, icon: Sparkles },
            { id: "notes", label: `Notes (${notes.length})`, icon: StickyNote },
            { id: "files", label: `Reference Photos (${allPhotos.length})`, icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-display text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "border-brand-lime text-ink"
                    : "border-transparent text-ink-muted hover:text-ink hover:border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & BRANDS */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Brands Section */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-heading-md text-ink">
                  Nested Brands &amp; Product SKUs
                </h3>
                <p className="text-body-xs text-ink-muted">
                  Client-owned brands with individual SKU specifications and dieline reference photos.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddBrandModal(true)}
                className="text-xs font-semibold gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Brand</span>
              </Button>
            </div>

            {brands.length === 0 ? (
              <div className="p-12 text-center rounded-card border border-dashed border-border bg-surface-muted/30 space-y-3">
                <Building className="w-8 h-8 text-ink-subtle mx-auto" />
                <p className="text-body-sm font-semibold text-ink">No brands created yet</p>
                <p className="text-body-xs text-ink-muted max-w-sm mx-auto">
                  Add this client&apos;s product brands to manage SKUs, dieline dimensions, and reference artwork.
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsAddBrandModal(true)}
                  className="bg-brand-lime text-ink font-bold shadow-tactile"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add First Brand
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {brands.map((brand) => {
                  const skus = skusByBrand[brand.id] || [];
                  return (
                    <div
                      key={brand.id}
                      className="p-6 rounded-card border border-border bg-surface shadow-soft space-y-5"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-brand-limeDark" />
                          <h4 className="font-display font-bold text-heading-sm text-ink">
                            {brand.name}
                          </h4>
                          {brand.notes && (
                            <span className="text-[11px] text-ink-muted font-mono">
                              &bull; {brand.notes}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddSkuModal(brand.id)}
                            className="text-xs h-7 gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add SKU
                          </Button>
                        </div>
                      </div>

                      {/* SKUs List */}
                      {skus.length === 0 ? (
                        <p className="text-xs text-ink-muted italic py-2">
                          No product SKUs recorded under this brand.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {skus.map((sku) => (
                            <div
                              key={sku.id}
                              className="p-4 rounded-xl border border-border bg-surface-muted/40 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-display font-bold text-body-sm text-ink">
                                  {sku.name}
                                </span>
                                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-brand-lime/20 text-ink border border-brand-lime/40">
                                  {sku.structure}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-ink-muted">
                                <div>
                                  <span className="text-[10px] text-ink-subtle uppercase block">Dimensions</span>
                                  <strong className="text-ink">{sku.dimensions}</strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-ink-subtle uppercase block">Material</span>
                                  <strong className="text-ink">{sku.materials}</strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-ink-subtle uppercase block">Finish</span>
                                  <span className="text-ink">{sku.finish}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-ink-subtle uppercase block">Accessories</span>
                                  <span className="text-ink">{sku.accessories || "None"}</span>
                                </div>
                              </div>

                              {/* Photo Thumbnails */}
                              <div className="pt-2 border-t border-border/80">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-mono uppercase text-ink-subtle font-semibold">
                                    Reference Photos ({sku.photos?.length || 0})
                                  </span>
                                  <label className="text-[11px] font-mono text-ink hover:underline cursor-pointer flex items-center gap-1">
                                    <Upload className="w-3 h-3 text-brand-lime" />
                                    <span>{uploadingSkuId === sku.id ? "Uploading..." : "Attach"}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={uploadingSkuId === sku.id}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadPhoto(brand.id, sku.id, file);
                                      }}
                                    />
                                  </label>
                                </div>

                                {sku.photos && sku.photos.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {sku.photos.map((photo, pIdx) => (
                                      <button
                                        key={pIdx}
                                        type="button"
                                        onClick={() => setLightboxUrl(photo.url || "")}
                                        className="h-12 w-12 rounded-lg border border-border overflow-hidden bg-surface hover:scale-105 transition-transform"
                                      >
                                        <img
                                          src={photo.url || ""}
                                          alt={photo.name}
                                          className="h-full w-full object-cover"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-ink-subtle italic">No photos attached</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONVERSATIONS */}
        {activeTab === "conversations" && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-heading-md text-ink">
              Customer Conversations
            </h3>
            {conversations.length === 0 ? (
              <p className="text-body-xs text-ink-muted italic p-8 text-center bg-surface rounded-card border border-border">
                No active conversations recorded for this client.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-card border border-border bg-surface shadow-soft">
                {conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/inbox?conversationId=${conv.id}`}
                    className="p-4 flex items-center justify-between hover:bg-surface-muted/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-display font-bold text-body-sm text-ink">{conv.title}</h4>
                      <p className="text-body-xs text-ink-muted truncate max-w-lg mt-0.5">
                        {conv.lastMessagePreview || "Empty chat thread"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
                      <span>{conv.messageCount} messages</span>
                      <ExternalLink className="w-3.5 h-3.5 text-brand-lime" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-heading-md text-ink">
              Production Orders
            </h3>
            {orders.length === 0 ? (
              <p className="text-body-xs text-ink-muted italic p-8 text-center bg-surface rounded-card border border-border">
                No orders created for this client yet.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-card border border-border bg-surface shadow-soft">
                {orders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/orders/${ord.id}`}
                    className="p-4 flex items-center justify-between hover:bg-surface-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-body-sm text-ink">
                        {ord.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-brand-lime/20 text-ink border border-brand-lime/40">
                        {ord.lifecycleStage || "Enquiry"}
                      </span>
                      <span className="text-xs text-ink-muted">
                        Status: <strong className="text-ink">{ord.status}</strong>
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEMORY BANK */}
        {activeTab === "memory" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-heading-md text-ink">
                  Customer Memory Bank
                </h3>
                <p className="text-body-xs text-ink-muted">
                  Client packaging preferences, shorthand terminology, and factory rules.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddMemoryModal(true)}
                className="text-xs font-semibold gap-1.5 bg-brand-lime text-ink shadow-tactile border border-brand-limeHover"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Memory Fact</span>
              </Button>
            </div>

            {memories.length === 0 ? (
              <p className="text-body-xs text-ink-muted italic p-8 text-center bg-surface rounded-card border border-border">
                No memory facts recorded for this client yet.
              </p>
            ) : (
              <div className="space-y-3">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-4 rounded-card border border-border bg-surface shadow-soft flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                            mem.kind === "rule"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : mem.kind === "preference"
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "bg-purple-100 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {mem.kind}
                        </span>

                        {mem.verified ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#1F8A4C] bg-[#E8F6EE] px-2 py-0.5 rounded-full border border-[#BDE6CE]">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertCircle className="w-3 h-3" /> Unverified (Produces INFERRED only)
                          </span>
                        )}
                      </div>

                      <p className="text-body-sm font-medium text-ink">{mem.fact}</p>

                      {mem.source && (mem.source.note || mem.source.orderId) && (
                        <p className="text-[11px] font-mono text-ink-muted">
                          Source: {mem.source.note || `Order #${mem.source.orderId}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVerifyMemory(mem.id, mem.verified)}
                        className="text-xs h-8"
                      >
                        {mem.verified ? "Unverify" : "Verify"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="text-ink-muted hover:text-red-500 h-8 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-heading-md text-ink">
                  Client Notes
                </h3>
                <p className="text-body-xs text-ink-muted">
                  Markdown notes scoped to this client account with pinning.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddNoteModal(true)}
                className="text-xs font-semibold gap-1.5 bg-brand-lime text-ink shadow-tactile border border-brand-limeHover"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </Button>
            </div>

            {notes.length === 0 ? (
              <p className="text-body-xs text-ink-muted italic p-8 text-center bg-surface rounded-card border border-border">
                No notes written for this client yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-card border shadow-soft space-y-3 ${
                      note.pinned ? "bg-amber-50/40 border-amber-200" : "bg-surface border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePinNote(note.id, note.pinned)}
                          className={`text-xs px-2 py-0.5 rounded ${
                            note.pinned
                              ? "bg-amber-100 text-amber-800 font-bold"
                              : "text-ink-muted hover:bg-surface-muted"
                          }`}
                        >
                          {note.pinned ? "Pinned" : "Pin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-ink-muted hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-body-sm text-ink whitespace-pre-wrap font-sans">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: FILES & PHOTOS */}
        {activeTab === "files" && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-heading-md text-ink">
              Reference Files &amp; Photos Gallery
            </h3>
            {allPhotos.length === 0 ? (
              <p className="text-body-xs text-ink-muted italic p-8 text-center bg-surface rounded-card border border-border">
                No photos or files attached across this client&apos;s SKUs yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {allPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl border border-border bg-surface overflow-hidden shadow-soft hover:shadow-tactile transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxUrl(photo.url || "")}
                      className="w-full aspect-square block"
                    >
                      <img
                        src={photo.url || ""}
                        alt={photo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </button>
                    <div className="p-2 text-[10px] font-mono text-ink truncate border-t border-border bg-surface-muted/30">
                      {photo.skuName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] bg-surface rounded-2xl overflow-hidden shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxUrl}
                alt="Reference artwork"
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Edit Client Modal */}
        {isEditClientModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-heading-sm text-ink">
                  Edit Client Profile
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditClientModal(false)}
                  className="p-1 rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateClient} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">Company / Brand Entity</label>
                  <input
                    type="text"
                    value={clientForm.company}
                    onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-ink-muted block mb-1">Phone</label>
                    <input
                      type="text"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-ink-muted block mb-1">Instagram</label>
                    <input
                      type="text"
                      value={clientForm.instagram}
                      onChange={(e) => setClientForm({ ...clientForm, instagram: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={clientForm.tags}
                    onChange={(e) => setClientForm({ ...clientForm, tags: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditClientModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand-lime text-ink font-bold shadow-tactile"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Brand Modal */}
        {isAddBrandModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-heading-sm text-ink">
                  Add Client Brand
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddBrandModal(false)}
                  className="p-1 rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBrand} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Botanica Organics"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">Notes / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Luxury Ayurvedic skincare line"
                    value={brandForm.notes}
                    onChange={(e) => setBrandForm({ ...brandForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddBrandModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand-lime text-ink font-bold shadow-tactile"
                  >
                    Create Brand
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add SKU Modal */}
        {isAddSkuModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-heading-sm text-ink">
                  Add Product SKU
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSkuModal(null)}
                  className="p-1 rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => handleCreateSku(e, isAddSkuModal)}
                className="space-y-3 text-xs font-mono"
              >
                <div>
                  <label className="text-ink-muted block mb-1">SKU Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50ml Serum Rigid Box"
                    value={skuForm.name}
                    onChange={(e) => setSkuForm({ ...skuForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-ink-muted block mb-1">Box Structure *</label>
                    <input
                      type="text"
                      required
                      value={skuForm.structure}
                      onChange={(e) => setSkuForm({ ...skuForm, structure: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-ink-muted block mb-1">Dimensions (L x W x H) *</label>
                    <input
                      type="text"
                      required
                      value={skuForm.dimensions}
                      onChange={(e) => setSkuForm({ ...skuForm, dimensions: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-ink-muted block mb-1">Board / Material *</label>
                    <input
                      type="text"
                      required
                      value={skuForm.materials}
                      onChange={(e) => setSkuForm({ ...skuForm, materials: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-ink-muted block mb-1">Finish &amp; Foiling *</label>
                    <input
                      type="text"
                      required
                      value={skuForm.finish}
                      onChange={(e) => setSkuForm({ ...skuForm, finish: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-ink-muted block mb-1">Accessories / Inserts</label>
                  <input
                    type="text"
                    value={skuForm.accessories}
                    onChange={(e) => setSkuForm({ ...skuForm, accessories: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddSkuModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand-lime text-ink font-bold shadow-tactile"
                  >
                    Create SKU
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Memory Modal */}
        {isAddMemoryModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-heading-sm text-ink">
                  Add Memory Fact
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddMemoryModal(false)}
                  className="p-1 rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">Memory Fact *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Always prefers 1.5mm Kappa board with matte finish, never gloss"
                    value={memoryForm.fact}
                    onChange={(e) => setMemoryForm({ ...memoryForm, fact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-ink-muted block mb-1">Kind</label>
                    <select
                      value={memoryForm.kind}
                      onChange={(e) => setMemoryForm({ ...memoryForm, kind: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                    >
                      <option value="preference">Preference</option>
                      <option value="shorthand">Shorthand</option>
                      <option value="pattern">Pattern</option>
                      <option value="rule">Rule</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-ink-muted block mb-1">Verification</label>
                    <label className="flex items-center gap-2 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={memoryForm.verified}
                        onChange={(e) => setMemoryForm({ ...memoryForm, verified: e.target.checked })}
                        className="rounded border-border text-brand-lime focus:ring-brand-lime"
                      />
                      <span className="text-xs text-ink font-sans">Mark as Verified</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddMemoryModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand-lime text-ink font-bold shadow-tactile"
                  >
                    Save Memory
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {isAddNoteModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-heading-sm text-ink">
                  Add Client Note
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddNoteModal(false)}
                  className="p-1 rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNote} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-ink-muted block mb-1">Markdown Content *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g. Client requested sample dieline check before next batch production."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-ink text-sm font-sans"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notePinned}
                      onChange={(e) => setNotePinned(e.target.checked)}
                      className="rounded border-border text-brand-lime focus:ring-brand-lime"
                    />
                    <span className="text-xs text-ink font-sans">Pin to top of client notes</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddNoteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand-lime text-ink font-bold shadow-tactile"
                  >
                    Save Note
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
