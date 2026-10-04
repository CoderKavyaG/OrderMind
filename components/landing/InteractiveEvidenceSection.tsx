"use client";

import * as React from "react";
import { StatusChip } from "@/components/ui-ordermind/StatusChip";
import { Button } from "@/components/ui/button";
import { Check, Quote, Sparkles, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecItem {
  id: string;
  field: string;
  value: string;
  status: "CONFIRMED" | "INFERRED";
  quote: string;
  messageId: string;
  sender: string;
  time: string;
  confidence: number;
}

export function InteractiveEvidenceSection() {
  const [activeFieldId, setActiveFieldId] = React.useState<string>("material");
  const [materialStatus, setMaterialStatus] = React.useState<"INFERRED" | "CONFIRMED">("INFERRED");

  const specs: SpecItem[] = [
    {
      id: "quantity",
      field: "Order Quantity",
      value: "500 units",
      status: "CONFIRMED",
      quote: "Actually bump it up to 500 units instead of 100.",
      messageId: "msg_109",
      sender: "Aarav Sharma (Customer)",
      time: "14:24 PM",
      confidence: 0.99,
    },
    {
      id: "dimensions",
      field: "External Dimensions",
      value: "200 x 140 x 90 mm",
      status: "CONFIRMED",
      quote: "Make it a little taller, about 90mm height so the jars fit.",
      messageId: "msg_105",
      sender: "Aarav Sharma (Customer)",
      time: "14:16 PM",
      confidence: 0.96,
    },
    {
      id: "material",
      field: "Board Material",
      value: "350 GSM White SBS board",
      status: materialStatus,
      quote: "Use the 350 GSM White SBS board with gold foil stamping on the lid.",
      messageId: "msg_108",
      sender: "Aarav Sharma (Customer)",
      time: "14:22 PM",
      confidence: 0.94,
    },
    {
      id: "finish",
      field: "Surface Finish & Foil",
      value: "Soft-Touch Matte + Spot Gold Foil",
      status: "CONFIRMED",
      quote: "Same textured matte finish as last time plus spot gold foil.",
      messageId: "msg_107",
      sender: "Aarav Sharma (Customer)",
      time: "14:20 PM",
      confidence: 0.97,
    },
  ];

  const activeSpec = specs.find((s) => s.id === activeFieldId) || specs[0];

  const handleConfirmMaterial = () => {
    setMaterialStatus("CONFIRMED");
  };

  const handleReset = () => {
    setMaterialStatus("INFERRED");
  };

  return (
    <section className="py-20 md:py-28 border-t border-border bg-canvas">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>03</span> • <span>Interactive Verification</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            Touch a field. See the verbatim proof.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            Hover over any field in the specification matrix. OrderMind instantly highlights the exact sentence in the raw chat where the customer said it, with confidence metrics and 1-click human confirmation.
          </p>
        </div>

        {/* Interactive Matrix Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Field Rows (6 cols) */}
          <div className="lg:col-span-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted px-1">
                <span>Packaging Specification Matrix</span>
                <span>Hover to inspect</span>
              </div>

              {specs.map((item) => {
                const isActive = item.id === activeFieldId;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveFieldId(item.id)}
                    onClick={() => setActiveFieldId(item.id)}
                    className={cn(
                      "p-4 rounded-card border transition-all duration-200 cursor-pointer select-none",
                      isActive
                        ? "bg-surface border-brand-lime shadow-tactile ring-2 ring-brand-lime/40"
                        : "bg-surface-elevated/70 border-border hover:bg-surface hover:border-[#D5D2C8]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-body-xs font-mono font-semibold uppercase tracking-wider text-ink-muted">
                        {item.field}
                      </span>
                      <StatusChip status={item.status} size="sm" />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <span className="font-mono text-body-lg font-bold text-ink">
                        {item.value}
                      </span>

                      {item.id === "material" && item.status === "INFERRED" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmMaterial();
                          }}
                          className="h-8 px-3 rounded-full text-body-xs font-semibold gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick status message */}
            <div className="pt-3 flex items-center justify-between text-body-xs font-mono text-ink-muted border-t border-border">
              <span>Interactive Simulator</span>
              {materialStatus === "CONFIRMED" && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-ink hover:underline"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to INFERRED
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Luminous Evidence Inspection Panel (6 cols) */}
          <div className="lg:col-span-6 rounded-card-lg border border-ink/30 bg-ink text-surface p-6 sm:p-7 shadow-tactile-dark flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#2C2E24] mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-lime text-ink font-bold text-xs">
                    <Quote className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-surface block">
                      Verbatim Quote Inspector
                    </span>
                    <span className="text-[11px] font-mono text-ink-darkMuted">
                      Cryptographic Evidence Trace
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime/20 px-2.5 py-0.5 text-body-xs font-mono font-bold text-brand-lime border border-brand-lime/40">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {Math.round(activeSpec.confidence * 100)}% Match
                </span>
              </div>

              {/* Verbatim Quote in 13px Mono */}
              <div className="rounded-card border border-[#2C2E24] bg-[#1C1E16] p-5 mb-6">
                <span className="text-[10px] font-mono text-brand-lime uppercase tracking-widest block mb-2 font-bold">
                  Matched Customer Sentence
                </span>
                <p className="font-mono text-mono-evidence text-surface leading-relaxed italic">
                  &ldquo;{activeSpec.quote}&rdquo;
                </p>
              </div>

              {/* Source Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-body-xs font-mono">
                <div className="rounded-xl border border-[#2A2D23] bg-[#1A1C14] p-3">
                  <span className="text-ink-darkMuted text-[10px] block uppercase">Sender</span>
                  <span className="text-surface font-semibold truncate block mt-0.5">
                    {activeSpec.sender}
                  </span>
                </div>
                <div className="rounded-xl border border-[#2A2D23] bg-[#1A1C14] p-3">
                  <span className="text-ink-darkMuted text-[10px] block uppercase">Message ID</span>
                  <span className="text-surface font-semibold block mt-0.5">
                    {activeSpec.messageId}
                  </span>
                </div>
                <div className="rounded-xl border border-[#2A2D23] bg-[#1A1C14] p-3 col-span-2 sm:col-span-1">
                  <span className="text-ink-darkMuted text-[10px] block uppercase">Timestamp</span>
                  <span className="text-surface font-semibold block mt-0.5">
                    {activeSpec.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status Guarantee */}
            <div className="mt-6 pt-4 border-t border-[#2C2E24] flex items-center justify-between text-body-xs font-mono text-ink-darkMuted">
              <span className="flex items-center gap-1.5 text-brand-lime font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Evidence-Backed Guarantee
              </span>
              <span>Zero Untraced Fields</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
