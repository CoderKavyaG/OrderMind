"use client";

import * as React from "react";
import { ProductionBriefSheet } from "@/components/ui-ordermind/ProductionBriefSheet";
import { StatusChip } from "@/components/ui-ordermind/StatusChip";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, FileCheck2, Printer, Copy, ShieldCheck, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProductionBriefSection() {
  const [isLocked, setIsLocked] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const sampleBrief = {
    orderNumber: "ORD-2026-881",
    customerName: "Aarav Prints Pvt Ltd",
    version: 3,
    confirmedAt: "Today, 14:30 PM",
    fields: {
      productType: "Rigid Telescoping Box with Magnetic Closure",
      quantity: "500 units",
      dimensions: "200 x 140 x 90 mm (Internal Cavity)",
      material: "350 GSM White SBS board + 1200 GSM Greyboard Core",
      finish: "Soft-Touch Matte Lamination",
      printing: "CMYK + Spot Gold Foil Stamping (Lid Logo)",
      accessories: "Black Satin Ribbon Pull & Custom Die-Cut EVA Foam Tray",
      deadline: "Friday, 17 Oct 2026 (Dispatch to Surat)",
      specialInstructions:
        "Foil alignment must stay within 0.2mm tolerance. Magnet must close with positive audible snap.",
    },
    attachments: [
      { name: "ProductionBrief_ORD881.pdf", type: "pdf", size: "1.2 MB" },
      { name: "DielineCut_200x140x90.dxf", type: "file", size: "480 KB" },
      { name: "GoldFoil_LidArtwork.ai", type: "file", size: "3.4 MB" },
    ],
  };

  return (
    <section className="py-20 md:py-28 border-t border-border bg-canvas">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>07</span> • <span>Factory Deliverable</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            A production brief that unlocks only when 100% confirmed.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            Estimators and press operators should never guess whether an order is final. The factory job sheet is locked behind mathematical validation: if even one required field is missing, inferred, or conflicting, the brief cannot be generated.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLocked(!isLocked)}
              className="rounded-full gap-1.5 h-8 text-body-xs bg-surface border-border"
            >
              {isLocked ? <Unlock className="w-3 h-3 text-[#1F8A4C]" /> : <Lock className="w-3 h-3 text-[#D64545]" />}
              Simulate {isLocked ? "Confirmed Order (Unlocked)" : "Pending Order (Locked)"}
            </Button>
          </div>
        </div>

        {/* Sealed Production Brief Card Preview */}
        <div className="max-w-4xl mx-auto rounded-card-lg border border-border bg-surface p-6 sm:p-10 shadow-floating relative overflow-hidden">
          {/* Locked State Overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-20 bg-surface/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF2F2] border border-[#F8BDBD] text-[#D64545] shadow-sm mb-4">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-display text-heading-md font-bold text-ink">
                Production Brief Locked
              </h3>
              <p className="mt-2 text-body-sm text-ink-muted max-w-md font-sans">
                Generation is blocked because <strong className="text-ink">1 unconfirmed delta</strong> and{" "}
                <strong className="text-ink">1 missing delivery date</strong> remain. Confirm all fields to unlock the printable brief.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsLocked(false)}
                className="mt-5 rounded-full font-semibold"
              >
                Confirm Remaining Fields to Unlock
              </Button>
            </div>
          )}

          {/* Unlocked Production Brief Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-lime text-ink shadow-tactile font-bold">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-heading-md font-bold text-ink">
                  Factory Job Brief #ORD-2026-881
                </h3>
                <p className="text-body-xs font-mono text-ink-muted">
                  Client: Aarav Prints Pvt Ltd • Confirmed Today 14:30 PM • Version 3
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusChip status="CONFIRMED" size="sm" />
              <Button
                variant="default"
                size="sm"
                onClick={() => setSheetOpen(true)}
                className="rounded-full font-semibold gap-1.5 shadow-tactile"
              >
                Open Full Sheet
              </Button>
            </div>
          </div>

          {/* Manufacturing Seal of Verification */}
          <div className="my-6 rounded-card border border-[#BDE6CE] bg-[#E8F6EE] p-4 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#1F8A4C] shrink-0" />
            <div className="text-left">
              <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-[#1F8A4C] block">
                Sealed For Press & Die-Cutting
              </span>
              <span className="text-[12px] text-ink-muted block mt-0.5">
                Every parameter derived from verified customer evidence. Ready for die-maker tooling and plate output.
              </span>
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            <div className="rounded-card border border-border bg-surface-elevated p-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Product Style
              </span>
              <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                Rigid Luxury Box
              </span>
            </div>

            <div className="rounded-card border border-border bg-surface-elevated p-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Quantity
              </span>
              <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                500 units
              </span>
            </div>

            <div className="rounded-card border border-border bg-surface-elevated p-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Dimensions
              </span>
              <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                200x140x90 mm
              </span>
            </div>

            <div className="rounded-card border border-border bg-surface-elevated p-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Board Grade
              </span>
              <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                350 GSM White SBS
              </span>
            </div>

            <div className="rounded-card border border-border bg-surface-elevated p-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Surface Coating
              </span>
              <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                Soft-Touch Matte
              </span>
            </div>

            <div className="rounded-card border border-border bg-surface-elevated p-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Special Printing
              </span>
              <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                Spot Gold Foil
              </span>
            </div>

            <div className="rounded-card border border-border bg-surface-elevated p-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Interior Cavity
              </span>
              <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                Die-Cut EVA Foam
              </span>
            </div>

            <div className="rounded-card border border-border bg-surface-elevated p-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Dispatch Target
              </span>
              <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                Friday 17 Oct
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-8 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-body-xs font-mono text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#1F8A4C]" />
              Immutable Version 3 Stamp
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Copied production brief text to clipboard")}
                className="rounded-full gap-1.5 h-8 bg-surface border-border text-ink"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSheetOpen(true)}
                className="rounded-full gap-1.5 h-8 bg-surface border-border text-ink"
              >
                <Printer className="w-3.5 h-3.5" /> Printable View
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Production Brief Slide-Out Sheet */}
      <ProductionBriefSheet
        data={sampleBrief}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </section>
  );
}
