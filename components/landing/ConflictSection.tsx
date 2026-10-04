"use client";

import * as React from "react";
import { ConflictCard } from "@/components/ui-ordermind/ConflictCard";
import { StatusChip } from "@/components/ui-ordermind/StatusChip";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

export function ConflictSection() {
  const [resolvedOption, setResolvedOption] = React.useState<"A" | "B" | null>(null);

  const handleResolve = (choice: "A" | "B") => {
    setResolvedOption(choice);
  };

  const handleReset = () => {
    setResolvedOption(null);
  };

  return (
    <section className="py-20 md:py-28 border-t border-border bg-canvas">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>05</span> • <span>Conflict Detection</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            When the customer contradicts themselves, AI flags it. You decide.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            The customer typed &ldquo;350 GSM gloss&rdquo; today, but also stated &ldquo;same material as last time&rdquo; (which was 300 GSM matte). An ordinary chatbot would guess or silently hallucinate. OrderMind flags the conflict side-by-side with quotes and awaits human sign-off.
          </p>
        </div>

        {/* Live Interactive ConflictCard Showcase */}
        <div className="max-w-4xl mx-auto">
          {resolvedOption ? (
            <div className="rounded-card-lg border border-[#BDE6CE] bg-[#E8F6EE] p-8 shadow-soft text-center space-y-4 animate-in fade-in-0 zoom-in-95">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1F8A4C] text-white shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2">
                  <StatusChip status="CONFIRMED" size="sm" />
                  <span className="font-display text-heading-md font-bold text-ink">
                    Conflict Resolved: Option {resolvedOption} Confirmed
                  </span>
                </div>
                <p className="text-body-sm text-ink-muted max-w-xl mx-auto font-sans">
                  The specification was locked as{" "}
                  <strong className="text-ink font-semibold">
                    {resolvedOption === "A" ? "350 GSM White SBS board" : "300 GSM Art Board Matte"}
                  </strong>
                  . A human confirmation event was appended to the immutable event log.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="rounded-full gap-1.5 bg-surface border-border text-ink"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Test Conflict Dialog Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ConflictCard
                field="Board Material & Surface Finish"
                explanation="Gemma detected contradictory customer inputs: Current chat states '350 GSM White SBS board', but historical reference 'same material as last time' resolves to 300 GSM Matte."
                optionA={{
                  label: "Option A (Draft Chat Stated)",
                  value: "350 GSM White SBS board",
                  quote: "Please deliver with 350 GSM White SBS board with gold foil.",
                  source: "WhatsApp message 5 (14:24 PM)",
                }}
                optionB={{
                  label: "Option B (Referenced Past Order)",
                  value: "300 GSM Art Board Matte",
                  quote: "Actually, make it same material as last time.",
                  source: "Order #1042 (Confirmed 12 Aug)",
                }}
                onResolve={handleResolve}
              />

              <div className="text-center">
                <span className="text-body-xs font-mono text-ink-muted">
                  Click either option above to see how 1-click human resolution resolves the conflict.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
