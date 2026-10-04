"use client";

import * as React from "react";
import { PlusCircle, ArrowRightLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClaimOperation = "set" | "delta" | "ref";

export interface ClaimChipProps extends React.HTMLAttributes<HTMLDivElement> {
  op: ClaimOperation;
  field: string;
  value: unknown;
  unit?: string;
  quote?: string;
  confidence?: number;
  interactive?: boolean;
}

export function ClaimChip({
  op,
  field,
  value,
  unit,
  quote,
  confidence,
  interactive = false,
  className,
  ...props
}: ClaimChipProps) {
  const configs: Record<
    ClaimOperation,
    {
      badge: string;
      label: string;
      icon: React.ReactNode;
      containerClass: string;
      badgeClass: string;
    }
  > = {
    set: {
      badge: "SET",
      label: "Direct Stated",
      icon: <Sparkles className="w-3 h-3 text-[#1F8A4C]" />,
      containerClass: "bg-surface border-border hover:border-[#C8E08C]",
      badgeClass: "bg-[#E8F6EE] text-[#1F8A4C] border border-[#BDE6CE]",
    },
    delta: {
      badge: "DELTA",
      label: "Relative Adjustment",
      icon: <PlusCircle className="w-3 h-3 text-[#B7791F]" />,
      containerClass: "bg-[#FEF7EC]/60 border-[#FCE0B8] hover:border-[#F9C985]",
      badgeClass: "bg-[#FEF7EC] text-[#B7791F] border border-[#FCE0B8]",
    },
    ref: {
      badge: "REF",
      label: "Historical Reference",
      icon: <ArrowRightLeft className="w-3 h-3 text-[#6B5BA5]" />,
      containerClass: "bg-[#F7F4FD]/70 border-[#DDD5F5] hover:border-[#C4B7EC]",
      badgeClass: "bg-[#F3EEFA] text-[#6B5BA5] border border-[#DDD5F5]",
    },
  };

  const config = configs[op] || configs.set;

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={quote ? `Extracted from: "${quote}"` : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-body-xs font-medium shadow-tactile transition-all duration-200 select-none",
        config.containerClass,
        interactive && "cursor-pointer hover:-translate-y-0.5 active:translate-y-0",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider",
          config.badgeClass
        )}
      >
        {config.icon}
        {config.badge}
      </span>

      <span className="font-semibold text-ink capitalize">{field}:</span>

      <span className="font-mono text-ink font-semibold">
        {String(value)}
        {unit && <span className="ml-1 text-[11px] font-normal text-ink-muted">{unit}</span>}
      </span>

      {confidence !== undefined && (
        <span className="text-[10px] text-ink-subtle font-mono">
          {Math.round(confidence > 1 ? confidence : confidence * 100)}%
        </span>
      )}
    </div>
  );
}
