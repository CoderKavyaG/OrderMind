"use client";

import * as React from "react";
import { Check, Sparkle, HelpCircle, AlertTriangle, Quote } from "lucide-react";
import { StatusChip } from "@/components/ui-ordermind/StatusChip";

export function FourStatesSection() {
  const states = [
    {
      status: "CONFIRMED" as const,
      color: "#1F8A4C",
      border: "border-[#BDE6CE]",
      bg: "bg-[#E8F6EE]/60",
      icon: <Check className="w-5 h-5 stroke-[2.5] text-[#1F8A4C]" />,
      summary: "Customer explicitly stated the value with verifiable evidence.",
      exampleField: "Quantity: 500 boxes",
      exampleQuote: "“Please produce 500 units for this Diwali gift batch.”",
      systemBehavior: "Direct candidate state. Automatically verified against raw message text.",
    },
    {
      status: "INFERRED" as const,
      color: "#B7791F",
      border: "border-[#FCE0B8]",
      bg: "bg-[#FEF7EC]/70",
      icon: <Sparkle className="w-5 h-5 stroke-[2] fill-[#B7791F]/20 text-[#B7791F]" />,
      summary: "Relative adjustment (delta) or historical reference requiring human confirmation.",
      exampleField: "Height: 90 mm (+20 mm delta)",
      exampleQuote: "“Make it a little taller, say 90mm so the spray bottles fit.”",
      systemBehavior: "Flagged with yellow badge. Unlocks only after estimator 1-click confirm.",
    },
    {
      status: "MISSING" as const,
      color: "#8E9182",
      border: "border-dashed border-[#C8C5BA]",
      bg: "bg-surface-muted/30",
      icon: <HelpCircle className="w-5 h-5 text-[#8E9182]" />,
      summary: "Required manufacturing specification not found in any conversation.",
      exampleField: "Target Dispatch Deadline: Missing",
      exampleQuote: "Customer has not stated delivery date yet.",
      systemBehavior: "Blocks production brief. Generates polite WhatsApp clarification question.",
    },
    {
      status: "CONFLICTING" as const,
      color: "#D64545",
      border: "border-[#F8BDBD]",
      bg: "bg-[#FDF2F2]/80",
      icon: <AlertTriangle className="w-5 h-5 text-[#D64545] animate-pulse" />,
      summary: "Contradictory values stated across messages or historical references.",
      exampleField: "Board Material: 350 GSM vs 300 GSM",
      exampleQuote: "“Same board as last time” vs “350 GSM White SBS board”.",
      systemBehavior: "Side-by-side prompt. Human picks winner; writes permanent audit trail.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>02</span> • <span>Deterministic Architecture</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            Four states of truth. Zero guessing.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            The LLM never directly decides order state. Every packaging parameter must belong to one of four strict, mathematically verifiable states.
          </p>
        </div>

        {/* 4 Large Tactile Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {states.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-card-lg border p-6 sm:p-7 shadow-soft transition-all duration-200 hover:shadow-tactile-hover hover:-translate-y-1 ${item.border} ${item.bg}`}
            >
              {/* Header with StatusChip */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface border border-border shadow-sm">
                    {item.icon}
                  </div>
                  <h3 className="font-display text-heading-md font-bold text-ink">
                    {item.status}
                  </h3>
                </div>
                <StatusChip status={item.status} size="sm" />
              </div>

              {/* Summary Description */}
              <p className="text-body-sm font-medium text-ink leading-relaxed">
                {item.summary}
              </p>

              {/* Concrete Packaging Example */}
              <div className="mt-4 rounded-card-sm bg-surface p-3.5 border border-border space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted">
                  <span>Packaging Spec</span>
                  <span>Source Quote</span>
                </div>
                <div className="font-mono text-body-sm font-bold text-ink">
                  {item.exampleField}
                </div>
                <div className="flex items-start gap-1.5 text-mono-evidence font-mono italic text-ink-muted bg-surface-muted/60 p-2 rounded-lg border border-border/60">
                  <Quote className="w-3 h-3 text-ink-subtle shrink-0 mt-0.5" />
                  <span>{item.exampleQuote}</span>
                </div>
              </div>

              {/* System Guarantee Note */}
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-ink-muted flex items-center justify-between">
                <span>System Guarantee:</span>
                <span className="font-semibold text-ink text-right">{item.systemBehavior}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
