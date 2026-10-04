"use client";

import * as React from "react";
import {
  StatusChip,
  FieldRow,
  EvidencePopover,
  ClaimChip,
  StatTile,
  PillNav,
  TactileTile,
  ChangeTimeline,
  TimelineDock,
  VoiceNoteBubble,
  WhatsAppBubble,
  ConflictCard,
  PipelineStrip,
  ProductionBriefSheet,
} from "@/components/ui-ordermind";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Layers,
  Sparkles,
  Package,
  Box,
  FileCheck,
  TrendingUp,
  Inbox,
  Users,
  Settings,
  Shield,
  FileText,
  Smartphone,
  Monitor,
  ExternalLink,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function DevComponentsPage() {
  const [activeNavTab, setActiveNavTab] = React.useState("all");
  const [timelineStep, setTimelineStep] = React.useState(2);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [briefOpen, setBriefOpen] = React.useState(false);
  const [activeStage, setActiveStage] = React.useState("normalization");

  // Sample data for demonstration
  const sampleEvidence = {
    messageId: "msg_4091",
    quote: "Please deliver before Friday next week and use the 350 GSM White SBS board with gold foil.",
    sender: "Aarav Sharma (Aarav Prints)",
    timestamp: "14:24 PM",
    confidence: 0.98,
    actor: "ai" as const,
  };

  const sampleTimelineEvents = [
    {
      id: "evt_1",
      field: "quantity",
      previousValue: 100,
      newValue: 500,
      unit: "boxes",
      timestamp: "14:15 PM",
      actor: "ai" as const,
      status: "INFERRED" as const,
      evidenceQuote: "Let's bump the quantity from 100 to 500 units instead.",
    },
    {
      id: "evt_2",
      field: "dimensions",
      previousValue: "200 x 140 x 70 mm",
      newValue: "200 x 140 x 90 mm",
      unit: "H",
      timestamp: "14:18 PM",
      actor: "ai" as const,
      status: "INFERRED" as const,
      evidenceQuote: "Make it a little taller, about 90mm height so the jars fit.",
    },
    {
      id: "evt_3",
      field: "material",
      previousValue: "300 GSM Matte",
      newValue: "350 GSM White SBS board",
      timestamp: "14:22 PM",
      actor: "human" as const,
      status: "CONFIRMED" as const,
      evidenceQuote: "Confirmed 350 GSM White SBS Board with customer via call.",
    },
  ];

  const briefSampleData = {
    orderNumber: "ORD-2026-881",
    customerName: "Aarav Prints Pvt Ltd",
    version: 3,
    confirmedAt: "Today, 14:30 PM",
    fields: {
      productType: "Rigid Luxury Box (Magnetic Closure)",
      quantity: "500 units",
      dimensions: "200 x 140 x 90 mm",
      material: "350 GSM White SBS Board",
      finish: "Soft-Touch Matte Lamination",
      printing: "CMYK + Spot Gold Foil Stamping",
      accessories: "Satin Ribbon Pull & EVA Foam Cavity",
      deadline: "Friday, 17 Oct 2026",
      specialInstructions:
        "Ensure gold foil alignment within 0.2mm tolerance on lid logo. Magnetic clasp must snap firmly.",
    },
    attachments: [
      { name: "ProductionBrief_ORD881.pdf", type: "pdf", size: "1.2 MB" },
      { name: "DielineCut_200x140x90.dxf", type: "file", size: "480 KB" },
      { name: "GoldFoil_VectorLogo.ai", type: "file", size: "3.4 MB" },
    ],
  };

  return (
    <div className="min-h-screen bg-canvas text-ink pb-24 selection:bg-brand-lime selection:text-ink">
      <Toaster />

      {/* Top Banner / System Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lime text-ink shadow-tactile font-display font-extrabold text-lg">
              OM
            </div>
            <div>
              <h1 className="font-display text-heading-md font-bold text-ink leading-tight">
                OrderMind Design System
              </h1>
              <p className="text-body-xs font-mono text-ink-muted">
                Storybook Catalog • Phase A Tokens & Custom Packaging Components
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand-lime/30 px-3 py-1 text-body-xs font-mono font-semibold text-ink border border-brand-lime/50">
              <Sparkles className="w-3.5 h-3.5" /> Signal Lime #C8F135
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={() => setBriefOpen(true)}
              className="gap-1.5 shadow-tactile font-semibold"
            >
              <FileCheck className="w-4 h-4" />
              Open Production Brief
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Catalog */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-12">
        {/* Navigation Quicklinks */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4 flex-wrap gap-3">
          <PillNav
            items={[
              { id: "all", label: "All Components", count: 14 },
              { id: "status", label: "Status & Claims" },
              { id: "evidence", label: "Evidence & Conflicts" },
              { id: "timeline", label: "Timeline & Replay" },
              { id: "chat", label: "Chat & Voice" },
              { id: "dashboard", label: "Tactile Tiles & Stats" },
            ]}
            activeId={activeNavTab}
            onChange={setActiveNavTab}
          />

          <div className="flex items-center gap-2 text-body-xs font-mono text-ink-muted">
            <span>Viewport:</span>
            <span className="rounded bg-surface px-2 py-0.5 border border-border">1440px Desktop</span>
            <span>/</span>
            <span className="rounded bg-surface px-2 py-0.5 border border-border">390px Mobile</span>
          </div>
        </div>

        {/* SECTION 1: DESIGN TOKENS & TYPOGRAPHY */}
        {(activeNavTab === "all" || activeNavTab === "dashboard") && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-display text-heading-lg font-bold text-ink">
                1. Design Tokens, Swatches & Typography
              </h2>
              <span className="text-body-xs font-mono text-ink-muted">Tailwind + CSS Tokens</span>
            </div>

            {/* Color Palette Swatches */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-card border border-border bg-[#EDEAE1] p-4 shadow-sm flex flex-col justify-between h-28">
                <span className="text-body-xs font-mono font-bold text-ink">#EDEAE1</span>
                <div>
                  <span className="text-body-xs font-semibold text-ink block">Canvas</span>
                  <span className="text-[11px] text-ink-muted">Kraft Cream Base</span>
                </div>
              </div>

              <div className="rounded-card border border-border bg-[#F7F5EF] p-4 shadow-sm flex flex-col justify-between h-28">
                <span className="text-body-xs font-mono font-bold text-ink">#F7F5EF</span>
                <div>
                  <span className="text-body-xs font-semibold text-ink block">Surface</span>
                  <span className="text-[11px] text-ink-muted">Tactile Layer</span>
                </div>
              </div>

              <div className="rounded-card border border-[#BDE82B] bg-[#C8F135] p-4 shadow-tactile flex flex-col justify-between h-28">
                <span className="text-body-xs font-mono font-bold text-ink">#C8F135</span>
                <div>
                  <span className="text-body-xs font-semibold text-ink block">Signal Lime</span>
                  <span className="text-[11px] text-ink">Brand / Hero CTA</span>
                </div>
              </div>

              <div className="rounded-card border border-border bg-[#14150F] p-4 shadow-tactile-dark flex flex-col justify-between h-28 text-surface">
                <span className="text-body-xs font-mono font-bold text-surface">#14150F</span>
                <div>
                  <span className="text-body-xs font-semibold text-surface block">Warm Ink</span>
                  <span className="text-[11px] text-surface/70">Primary Typography</span>
                </div>
              </div>

              <div className="rounded-card border border-[#BDE6CE] bg-[#1F8A4C] p-4 shadow-sm flex flex-col justify-between h-28 text-white">
                <span className="text-body-xs font-mono font-bold">#1F8A4C</span>
                <div>
                  <span className="text-body-xs font-semibold block">Confirmed</span>
                  <span className="text-[11px] opacity-80">Strict Field Status</span>
                </div>
              </div>

              <div className="rounded-card border border-[#F8BDBD] bg-[#D64545] p-4 shadow-sm flex flex-col justify-between h-28 text-white">
                <span className="text-body-xs font-mono font-bold">#D64545</span>
                <div>
                  <span className="text-body-xs font-semibold block">Conflicting</span>
                  <span className="text-[11px] opacity-80">Strict Field Status</span>
                </div>
              </div>
            </div>

            {/* Typography Scale Showcase */}
            <Card className="p-6">
              <h3 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
                Typography Scale
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border/60 pb-3 gap-2">
                  <span className="text-[11px] font-mono text-ink-muted w-32 shrink-0">Display 72</span>
                  <span className="font-display text-display-xl text-ink leading-none">
                    Packaging 72
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border/60 pb-3 gap-2">
                  <span className="text-[11px] font-mono text-ink-muted w-32 shrink-0">Display 48</span>
                  <span className="font-display text-display-md text-ink leading-none">
                    500 Rigid Boxes
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border/60 pb-3 gap-2">
                  <span className="text-[11px] font-mono text-ink-muted w-32 shrink-0">Heading 32 / 24</span>
                  <span className="font-display text-heading-lg text-ink">
                    Order Verification Pipeline
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border/60 pb-3 gap-2">
                  <span className="text-[11px] font-mono text-ink-muted w-32 shrink-0">Body 16 / 14</span>
                  <span className="text-body-lg text-ink font-sans">
                    OrderMind converts unstructured customer discussions into deterministic production orders.
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <span className="text-[11px] font-mono text-ink-muted w-32 shrink-0">Mono Evidence 13</span>
                  <span className="font-mono text-mono-evidence text-ink bg-surface-muted px-2.5 py-1 rounded-md">
                    &ldquo;bump the quantity to 500 units and use 350 GSM White SBS board&rdquo;
                  </span>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* SECTION 2: STATUS CHIPS, CLAIM CHIPS & FIELD ROWS */}
        {(activeNavTab === "all" || activeNavTab === "status") && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-display text-heading-lg font-bold text-ink">
                2. Status Chips, Claim Chips & Field Rows
              </h2>
              <span className="text-body-xs font-mono text-ink-muted">Precision Order States</span>
            </div>

            {/* StatusChip all 4 variants */}
            <Card className="p-6">
              <h3 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
                Field Status Chips (Strict 4 Colors Only)
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip status="CONFIRMED" evidenceCount={3} interactive />
                <StatusChip status="INFERRED" evidenceCount={1} interactive />
                <StatusChip status="MISSING" interactive />
                <StatusChip status="CONFLICTING" evidenceCount={2} interactive />

                <Separator orientation="vertical" className="h-6 mx-2" />

                <StatusChip status="CONFIRMED" size="sm" />
                <StatusChip status="INFERRED" size="sm" />
                <StatusChip status="MISSING" size="sm" />
                <StatusChip status="CONFLICTING" size="sm" />
              </div>
            </Card>

            {/* ClaimChip SET / DELTA / REF */}
            <Card className="p-6">
              <h3 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
                Extraction Claim Chips (SET, DELTA, REF)
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <ClaimChip
                  op="set"
                  field="quantity"
                  value={500}
                  unit="units"
                  quote="Let's bump to 500 units"
                  confidence={0.99}
                  interactive
                />
                <ClaimChip
                  op="delta"
                  field="dimensions"
                  value="+20mm"
                  unit="height"
                  quote="make it a little taller, about 90mm"
                  confidence={0.94}
                  interactive
                />
                <ClaimChip
                  op="ref"
                  field="material"
                  value="Aarav Box v1"
                  quote="same material as last time"
                  confidence={0.92}
                  interactive
                />
              </div>
            </Card>

            {/* FieldRow Showcase */}
            <Card className="p-6 space-y-3">
              <h3 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Interactive Packaging Specification Field Rows
              </h3>

              <FieldRow
                label="Product Type"
                value="Rigid Magnetic Luxury Box"
                status="CONFIRMED"
                evidence={sampleEvidence}
                onJumpToMessage={(id) => toast.info(`Navigating to message ${id}`)}
              />

              <FieldRow
                label="Quantity"
                value="500"
                unit="boxes"
                status="INFERRED"
                evidence={{
                  quote: "Let's bump the quantity from 100 to 500 units instead.",
                  sender: "Aarav Sharma",
                  confidence: 0.95,
                  timestamp: "14:15 PM",
                }}
                onConfirm={() => toast.success("Quantity confirmed as 500 boxes")}
                onEdit={() => toast.info("Editing quantity...")}
              />

              <FieldRow
                label="Surface Material"
                value="350 GSM White SBS board"
                status="CONFLICTING"
                evidence={{
                  quote: "same material as last time vs 350 GSM White SBS board",
                  sender: "Customer vs History",
                  confidence: 0.88,
                }}
                onEdit={() => toast.info("Opening conflict resolution dialog")}
              />

              <FieldRow
                label="Delivery Deadline"
                value={null}
                status="MISSING"
                onEdit={() => toast.info("Set delivery deadline")}
              />
            </Card>
          </section>
        )}

        {/* SECTION 3: EVIDENCE POPOVER & CONFLICT RESOLUTION */}
        {(activeNavTab === "all" || activeNavTab === "evidence") && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-display text-heading-lg font-bold text-ink">
                3. Evidence Quotes & Conflict Resolution
              </h2>
              <span className="text-body-xs font-mono text-ink-muted">Zero Hallucinations Guarantee</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Evidence Trigger Card */}
              <Card className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Evidence Popover
                  </h3>
                  <p className="text-body-sm text-ink-muted mb-4">
                    Every field maintains a cryptographic connection to exact customer quotes in 13px mono font with confidence and jump links.
                  </p>
                  <EvidencePopover
                    evidence={sampleEvidence}
                    onJumpToMessage={(id) => toast.info(`Navigated to chat message #${id}`)}
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-border/60 text-[11px] font-mono text-ink-subtle">
                  Click the button above to view the verbatim quote popover.
                </div>
              </Card>

              {/* Side-by-Side Conflict Card */}
              <div className="lg:col-span-2">
                <ConflictCard
                  field="Material Specification"
                  explanation="Customer requested 'same material as last time' (which was 300 GSM Matte in Order #1042), but previously stated '350 GSM White SBS board'."
                  optionA={{
                    label: "Option A (Direct Chat Quote)",
                    value: "350 GSM White SBS board",
                    quote: "Please deliver with 350 GSM White SBS board with gold foil.",
                    source: "WhatsApp (14:24 PM)",
                  }}
                  optionB={{
                    label: "Option B (Referenced Historical Order)",
                    value: "300 GSM Art Board Matte",
                    quote: "Actually, make it same material as last time.",
                    source: "Order #1042 (Confirmed 12 Aug)",
                  }}
                  onResolve={(choice) =>
                    toast.success(
                      `Resolved conflict! Accepted Option ${choice} and updated order event.`
                    )
                  }
                />
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: CHANGE TIMELINE & BOTTOM DOCK */}
        {(activeNavTab === "all" || activeNavTab === "timeline") && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-display text-heading-lg font-bold text-ink">
                4. Git-Style Change Timeline & Scrubber Dock
              </h2>
              <span className="text-body-xs font-mono text-ink-muted">Deterministic Event Replay</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <Card className="lg:col-span-2 p-6">
                <h3 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
                  Branching Change Timeline
                </h3>
                <ChangeTimeline
                  events={sampleTimelineEvents}
                  onSelectEvent={(e) => toast.info(`Selected event on field: ${e.field}`)}
                />
              </Card>

              {/* Timeline Dock Widget */}
              <div className="space-y-4">
                <Card className="p-6">
                  <h3 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Scrubber Dock Controller
                  </h3>
                  <p className="text-body-sm text-ink-muted mb-4">
                    Interactive bottom scrubber simulating state replay across event versions.
                  </p>
                  <TimelineDock
                    currentStep={timelineStep}
                    totalSteps={5}
                    onStepChange={setTimelineStep}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    stepLabels={[
                      "Initial Voice Ingest (100 units)",
                      "Quantity Bump (+400 units)",
                      "Height Delta (+20mm)",
                      "Material Confirmed",
                      "Sealed Production Brief v3",
                    ]}
                  />
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: MULTIMODAL CHAT & VOICE BUBBLES */}
        {(activeNavTab === "all" || activeNavTab === "chat") && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-display text-heading-lg font-bold text-ink">
                5. WhatsApp & Voice Note Bubbles
              </h2>
              <span className="text-body-xs font-mono text-ink-muted">Multimodal Chat Elements</span>
            </div>

            <Card className="p-6 space-y-6 bg-surface-muted/30">
              <WhatsAppBubble
                senderName="Aarav Sharma"
                senderRole="customer"
                timestamp="14:10 PM"
                content="Hey team, can we prepare an urgent batch of 500 rigid boxes for our festive perfume line? Here is the artwork preview."
                highlightQuote="500 rigid boxes"
                onSelectQuote={(q) => toast.info(`Claim quote: "${q}"`)}
                attachments={[
                  { id: "1", name: "Box_Preview_Render.png", type: "image", size: "2.1 MB" },
                  { id: "2", name: "Dieline_Specs.pdf", type: "pdf", size: "640 KB" },
                ]}
              />

              <VoiceNoteBubble
                duration="0:48"
                senderName="Aarav Sharma"
                senderRole="customer"
                timestamp="14:16 PM"
                transcript="Hello! Also make the box height 90mm instead of 70mm so our 100ml spray bottles fit snugly without pressing the lid."
                onPlayToggle={(p) => toast(p ? "Voice note playing..." : "Voice note paused")}
              />

              <WhatsAppBubble
                senderName="OrderMind Ingestion Bot"
                senderRole="business"
                timestamp="14:18 PM"
                readStatus="read"
                content="Received! We have extracted 500 boxes, 90mm height adjustment, and linked your previous matte finish reference."
              />
            </Card>
          </section>
        )}

        {/* SECTION 6: TACTILE TILES, STATS & PIPELINE STRIP */}
        {(activeNavTab === "all" || activeNavTab === "dashboard") && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-display text-heading-lg font-bold text-ink">
                6. Tactile Tiles, Stat Counters & Pipeline Strip
              </h2>
              <span className="text-body-xs font-mono text-ink-muted">Workspace Primitives</span>
            </div>

            {/* Pipeline Strip */}
            <div className="space-y-2">
              <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
                Order Processing Pipeline Strip
              </span>
              <PipelineStrip
                currentStageId={activeStage}
                onStageClick={(id) => {
                  setActiveStage(id);
                  toast.info(`Active pipeline stage: ${id}`);
                }}
              />
            </div>

            {/* StatTiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile
                value="34"
                label="Orders Extracted"
                delta={{ value: "+3", trend: "up", label: "today" }}
                icon={<Package className="w-5 h-5" />}
                subtitle="From 12 WhatsApp chats"
              />

              <StatTile
                value="20"
                label="Confirmed Ready"
                delta={{ value: "+2", trend: "up", label: "sealed" }}
                icon={<FileCheck className="w-5 h-5" />}
                subtitle="100% specs verified"
              />

              <StatTile
                value="3"
                label="Needs Attention"
                delta={{ value: "!1", trend: "alert", label: "conflict" }}
                icon={<Shield className="w-5 h-5 text-[#D64545]" />}
                subtitle="Requires operator 1-click"
              />

              <StatTile
                value="99.4%"
                label="Quote Accuracy"
                delta={{ value: "+0.6%", trend: "up" }}
                icon={<Sparkles className="w-5 h-5 text-brand-lime" />}
                subtitle="Zero hallucinations"
                dark
              />
            </div>

            {/* Tactile Tiles */}
            <Card className="p-6">
              <h3 className="font-display text-body-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
                Tactile Tiles (Highlight + Shadow Elevation, 8px Grid)
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <TactileTile
                  icon={<Inbox className="w-5 h-5" />}
                  variant="light"
                  badge={7}
                  onClick={() => toast.info("Inbox tile clicked")}
                />
                <TactileTile
                  icon={<Package className="w-5 h-5" />}
                  variant="lime"
                  onClick={() => toast.info("Orders tile clicked")}
                />
                <TactileTile
                  icon={<Users className="w-5 h-5" />}
                  variant="dark"
                  onClick={() => toast.info("Customers tile clicked")}
                />
                <TactileTile
                  icon={<Settings className="w-5 h-5" />}
                  variant="sunken"
                  onClick={() => toast.info("Settings tile clicked")}
                />
              </div>
            </Card>
          </section>
        )}
      </main>

      {/* Production Brief Sheet Drawer Preview */}
      <ProductionBriefSheet
        data={briefSampleData}
        open={briefOpen}
        onOpenChange={setBriefOpen}
      />
    </div>
  );
}
