"use client";

import * as React from "react";
import { AlertTriangle, Check, ArrowRight, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "./StatusChip";
import { cn } from "@/lib/utils";

export interface ConflictOption {
  label: string;
  value: string | number;
  quote: string;
  source: string;
  timestamp?: string;
}

export interface ConflictCardProps {
  field: string;
  explanation?: string;
  optionA: ConflictOption;
  optionB: ConflictOption;
  onResolve?: (choice: "A" | "B") => void;
  className?: string;
}

export function ConflictCard({
  field,
  explanation = "Customer stated contradictory packaging specifications across different messages.",
  optionA,
  optionB,
  onResolve,
  className,
}: ConflictCardProps) {
  return (
    <div
      className={cn(
        "rounded-card-lg border border-status-conflicting/50 bg-[#FDF2F2]/80 p-5 shadow-soft transition-all duration-200",
        className
      )}
    >
      {/* Top Conflict Alert Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#F8BDBD] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF2F2] border border-[#D64545] text-[#D64545]">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-[#D64545]">
                Conflict Detected
              </span>
              <span className="font-display text-body-sm font-bold text-ink capitalize">
                Field: {field}
              </span>
            </div>
          </div>
        </div>

        <StatusChip status="CONFLICTING" size="sm" />
      </div>

      {/* Gemma Explanation Note */}
      {explanation && (
        <div className="mb-4 flex items-start gap-2 rounded-card-sm bg-surface p-3 border border-border text-body-sm text-ink-muted">
          <Sparkles className="w-4 h-4 text-brand-lime shrink-0 mt-0.5" />
          <p className="font-sans leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Two Competing Options Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option A */}
        <div className="flex flex-col justify-between rounded-card border border-border bg-surface p-4 shadow-sm hover:border-[#D64545]/60 transition-all">
          <div>
            <div className="flex items-center justify-between text-body-xs text-ink-muted mb-2">
              <span className="font-semibold uppercase tracking-wider text-ink">
                {optionA.label || "Option A (Draft Claim)"}
              </span>
              <span className="text-[11px] font-mono text-ink-subtle">
                {optionA.source}
              </span>
            </div>

            <div className="my-2">
              <span className="font-mono text-heading-md font-bold text-ink">
                {String(optionA.value)}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-1.5 rounded-card-sm bg-surface-muted/60 p-2.5 border border-border/80">
              <Quote className="w-3.5 h-3.5 text-ink-subtle shrink-0 mt-0.5" />
              <p className="font-mono text-mono-evidence text-ink italic leading-relaxed">
                &ldquo;{optionA.quote}&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve?.("A")}
              className="w-full rounded-full font-semibold gap-1.5 hover:bg-brand-lime hover:text-ink hover:border-brand-lime"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              Confirm {String(optionA.value)}
            </Button>
          </div>
        </div>

        {/* Option B */}
        <div className="flex flex-col justify-between rounded-card border border-border bg-surface p-4 shadow-sm hover:border-[#D64545]/60 transition-all">
          <div>
            <div className="flex items-center justify-between text-body-xs text-ink-muted mb-2">
              <span className="font-semibold uppercase tracking-wider text-ink">
                {optionB.label || "Option B (Referenced / Previous)"}
              </span>
              <span className="text-[11px] font-mono text-ink-subtle">
                {optionB.source}
              </span>
            </div>

            <div className="my-2">
              <span className="font-mono text-heading-md font-bold text-ink">
                {String(optionB.value)}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-1.5 rounded-card-sm bg-surface-muted/60 p-2.5 border border-border/80">
              <Quote className="w-3.5 h-3.5 text-ink-subtle shrink-0 mt-0.5" />
              <p className="font-mono text-mono-evidence text-ink italic leading-relaxed">
                &ldquo;{optionB.quote}&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve?.("B")}
              className="w-full rounded-full font-semibold gap-1.5 hover:bg-brand-lime hover:text-ink hover:border-brand-lime"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              Confirm {String(optionB.value)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
