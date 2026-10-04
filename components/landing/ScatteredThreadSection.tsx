"use client";

import * as React from "react";
import { WhatsAppBubble } from "@/components/ui-ordermind/WhatsAppBubble";
import { VoiceNoteBubble } from "@/components/ui-ordermind/VoiceNoteBubble";
import { StatusChip } from "@/components/ui-ordermind/StatusChip";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Check, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderFieldPreview {
  label: string;
  value: string;
  status: "CONFIRMED" | "INFERRED" | "MISSING" | "CONFLICTING";
  evidence: string;
}

export function ScatteredThreadSection() {
  const [activeStep, setActiveStep] = React.useState(5);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(false);

  React.useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 2400);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const orderFields: Record<number, OrderFieldPreview[]> = {
    1: [
      { label: "Product Type", value: "Luxury Rigid Boxes", status: "CONFIRMED", evidence: "custom luxury rigid boxes" },
      { label: "Quantity", value: "100 units", status: "CONFIRMED", evidence: "start with 100 units" },
      { label: "Dimensions", value: "Pending in chat...", status: "MISSING", evidence: "" },
      { label: "Material", value: "Pending in chat...", status: "MISSING", evidence: "" },
    ],
    2: [
      { label: "Product Type", value: "Rigid Box w/ Magnetic Flap", status: "CONFIRMED", evidence: "Lid_Preview.png attachment" },
      { label: "Quantity", value: "100 units", status: "CONFIRMED", evidence: "start with 100 units" },
      { label: "Dimensions", value: "Pending in chat...", status: "MISSING", evidence: "" },
      { label: "Material", value: "Pending in chat...", status: "MISSING", evidence: "" },
    ],
    3: [
      { label: "Product Type", value: "Rigid Box w/ Magnetic Flap", status: "CONFIRMED", evidence: "Lid_Preview.png attachment" },
      { label: "Quantity", value: "100 units", status: "CONFIRMED", evidence: "start with 100 units" },
      { label: "Dimensions", value: "200 x 140 x 90 mm", status: "INFERRED", evidence: "make it a little taller, about 90mm" },
      { label: "Material", value: "Pending in chat...", status: "MISSING", evidence: "" },
    ],
    4: [
      { label: "Product Type", value: "Rigid Box w/ Magnetic Flap", status: "CONFIRMED", evidence: "Lid_Preview.png attachment" },
      { label: "Quantity", value: "100 units", status: "CONFIRMED", evidence: "start with 100 units" },
      { label: "Dimensions", value: "200 x 140 x 90 mm", status: "INFERRED", evidence: "make it a little taller, about 90mm" },
      { label: "Material", value: "300 GSM Matte (Order #1042)", status: "INFERRED", evidence: "same board material as last time" },
    ],
    5: [
      { label: "Product Type", value: "Rigid Box w/ Magnetic Flap", status: "CONFIRMED", evidence: "Lid_Preview.png attachment" },
      { label: "Quantity", value: "500 units", status: "INFERRED", evidence: "bump it up to 500 units instead of 100" },
      { label: "Dimensions", value: "200 x 140 x 90 mm", status: "INFERRED", evidence: "make it a little taller, about 90mm" },
      { label: "Material", value: "300 GSM Matte (Order #1042)", status: "INFERRED", evidence: "same board material as last time" },
    ],
  };

  const currentFields = orderFields[activeStep] || orderFields[5];

  return (
    <section id="how-it-works" className="py-20 md:py-28 border-t border-border bg-canvas relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>01</span> • <span>Live Multimodal Ingestion</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            The order is scattered. OrderMind compiles it.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            Customers rarely send a tidy purchase order. They send five WhatsApp messages, a voice note while driving, and a photo of a box they liked. Watch how unstructured chats lift into an evidence-backed specification in real time.
          </p>

          {/* Interactive Stepper Controller */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveStep(step);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-body-xs font-mono font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-lime",
                  activeStep === step
                    ? "bg-brand-lime text-ink shadow-tactile border border-brand-limeHover"
                    : "bg-surface text-ink-muted border border-border hover:bg-surface-muted"
                )}
              >
                Msg {step}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="rounded-full gap-1.5 h-8 text-body-xs bg-surface border-border"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3 h-3" /> Pause Replay
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" /> Auto Replay
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Two-Column Showcase: Scripted WhatsApp Thread vs Structured Order Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Scripted Chat Stream (7 cols) */}
          <div className="lg:col-span-6 space-y-4 rounded-card-lg border border-border bg-[#EFECE3] p-4 sm:p-6 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-[#25D366]" />
                <span className="text-body-xs font-semibold uppercase tracking-wider text-ink font-mono">
                  WhatsApp • Aarav Prints (Customer)
                </span>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Active Stream</span>
            </div>

            <div className="space-y-4">
              {/* Message 1 */}
              <div className={cn("transition-opacity duration-300", activeStep >= 1 ? "opacity-100" : "opacity-30")}>
                <WhatsAppBubble
                  senderName="Aarav Sharma"
                  senderRole="customer"
                  timestamp="14:10 PM"
                  content="Hi team! Need an urgent batch of luxury rigid boxes for our festive perfume line. Can we start with 100 units?"
                  highlightQuote={activeStep >= 1 ? "100 units" : undefined}
                />
              </div>

              {/* Message 2: Photo Attachment */}
              <div className={cn("transition-opacity duration-300", activeStep >= 2 ? "opacity-100" : "opacity-30")}>
                <WhatsAppBubble
                  senderName="Aarav Sharma"
                  senderRole="customer"
                  timestamp="14:12 PM"
                  content="Here is the style we want—rigid telescoping box with magnetic flap closure."
                  attachments={[{ id: "1", name: "Lid_Preview.png", type: "image", size: "1.8 MB" }]}
                />
              </div>

              {/* Message 3: Voice Note */}
              <div className={cn("transition-opacity duration-300", activeStep >= 3 ? "opacity-100" : "opacity-30")}>
                <VoiceNoteBubble
                  duration="0:48"
                  senderName="Aarav Sharma"
                  senderRole="customer"
                  timestamp="14:16 PM"
                  transcript="Also make it a little taller, about 90mm height so the perfume spray bottles fit snugly."
                />
              </div>

              {/* Message 4: Reference */}
              <div className={cn("transition-opacity duration-300", activeStep >= 4 ? "opacity-100" : "opacity-30")}>
                <WhatsAppBubble
                  senderName="Aarav Sharma"
                  senderRole="customer"
                  timestamp="14:20 PM"
                  content="Same board material as last time please! That textured matte finish looked great."
                  highlightQuote={activeStep >= 4 ? "Same board material as last time" : undefined}
                />
              </div>

              {/* Message 5: Delta Quantity */}
              <div className={cn("transition-opacity duration-300", activeStep >= 5 ? "opacity-100" : "opacity-30")}>
                <WhatsAppBubble
                  senderName="Aarav Sharma"
                  senderRole="customer"
                  timestamp="14:24 PM"
                  content="Wait, sales team just reviewed orders. Actually bump it up to 500 units instead of 100."
                  highlightQuote={activeStep >= 5 ? "bump it up to 500 units instead of 100" : undefined}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Structured Order Card Materializing (6 cols) */}
          <div className="lg:col-span-6 rounded-card-lg border border-border bg-surface p-6 shadow-floating sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-lime text-ink font-bold shadow-tactile text-xs">
                  OM
                </div>
                <div>
                  <h3 className="font-display text-body-sm font-bold text-ink">
                    Structured Order #ORD-2026-881
                  </h3>
                  <p className="text-[11px] font-mono text-ink-muted">
                    Deterministic Event Reducer • Replaying Step {activeStep} of 5
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-brand-lime/20 px-2.5 py-0.5 text-[11px] font-mono font-bold text-ink border border-brand-lime/50">
                Live State
              </span>
            </div>

            {/* Structured Fields Stack */}
            <div className="mt-5 space-y-3">
              {currentFields.map((field, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3.5 rounded-card border transition-all duration-300",
                    field.status === "CONFIRMED"
                      ? "bg-surface-elevated border-[#BDE6CE]"
                      : field.status === "INFERRED"
                      ? "bg-[#FEF7EC]/70 border-[#FCE0B8]"
                      : "bg-surface-muted/30 border-dashed border-[#C8C5BA]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted font-mono">
                      {field.label}
                    </span>
                    <StatusChip status={field.status} size="sm" />
                  </div>

                  <div className="mt-1 font-mono text-body-sm font-bold text-ink">
                    {field.value}
                  </div>

                  {field.evidence && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-ink-subtle italic truncate">
                      <Sparkles className="w-3 h-3 text-brand-lime shrink-0" />
                      <span>&ldquo;{field.evidence}&rdquo;</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Human Verification Footer Banner */}
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-body-xs text-ink-muted">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-[#1F8A4C]" />
                Evidence linked to source quotes
              </span>
              <span className="font-mono text-[11px] text-ink">
                Human-Confirmed Sign-off
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
