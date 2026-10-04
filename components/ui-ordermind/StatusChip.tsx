"use client";

import * as React from "react";
import { Check, Sparkle, HelpCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderFieldStatus =
  | "CONFIRMED"
  | "INFERRED"
  | "MISSING"
  | "CONFLICTING"
  | "DRAFT"
  | "NEEDS_REVIEW";

export interface StatusChipProps extends React.HTMLAttributes<HTMLDivElement> {
  status: OrderFieldStatus;
  size?: "sm" | "default" | "lg";
  evidenceCount?: number;
  interactive?: boolean;
}

export function StatusChip({
  status,
  size = "default",
  evidenceCount,
  interactive = false,
  className,
  ...props
}: StatusChipProps) {
  const configs: Record<
    OrderFieldStatus,
    {
      label: string;
      icon: React.ReactNode;
      containerClass: string;
      dotClass: string;
      evidenceClass: string;
    }
  > = {
    CONFIRMED: {
      label: "CONFIRMED",
      icon: <Check className="w-full h-full stroke-[3]" />,
      containerClass:
        "bg-[#E8F6EE] text-[#1F8A4C] border border-[#BDE6CE] shadow-sm",
      dotClass: "bg-[#1F8A4C]",
      evidenceClass: "bg-[#1F8A4C]/15 text-[#1F8A4C]",
    },
    INFERRED: {
      label: "INFERRED",
      icon: <Sparkle className="w-full h-full stroke-[2.2] fill-[#B7791F]/20" />,
      containerClass:
        "bg-[#FEF7EC] text-[#B7791F] border border-[#FCE0B8] shadow-sm",
      dotClass: "bg-[#B7791F]",
      evidenceClass: "bg-[#B7791F]/15 text-[#B7791F]",
    },
    MISSING: {
      label: "MISSING",
      icon: <HelpCircle className="w-full h-full stroke-[2]" />,
      containerClass:
        "bg-[#F2EFE8] text-[#8E9182] border-2 border-dashed border-[#C8C5BA]",
      dotClass: "bg-[#8E9182]",
      evidenceClass: "bg-[#8E9182]/15 text-[#8E9182]",
    },
    CONFLICTING: {
      label: "CONFLICTING",
      icon: <AlertTriangle className="w-full h-full stroke-[2] animate-pulse" />,
      containerClass:
        "bg-[#FDF2F2] text-[#D64545] border border-[#F8BDBD] shadow-sm",
      dotClass: "bg-[#D64545]",
      evidenceClass: "bg-[#D64545]/15 text-[#D64545]",
    },
    DRAFT: {
      label: "DRAFT",
      icon: <HelpCircle className="w-full h-full stroke-[2]" />,
      containerClass:
        "bg-surface-muted text-ink-muted border border-border shadow-xs",
      dotClass: "bg-ink-muted",
      evidenceClass: "bg-surface-muted text-ink-muted",
    },
    NEEDS_REVIEW: {
      label: "NEEDS REVIEW",
      icon: <AlertTriangle className="w-full h-full stroke-[2]" />,
      containerClass:
        "bg-[#FEF7EC] text-[#B7791F] border border-[#FCE0B8] shadow-xs",
      dotClass: "bg-[#B7791F]",
      evidenceClass: "bg-[#FEF7EC] text-[#B7791F]",
    },
  };

  const config = configs[status] || configs.MISSING;

  const sizeClasses = {
    sm: "text-[11px] px-2.5 py-0.5 gap-1.5 font-semibold",
    default: "text-[12px] px-3 py-1 gap-1.5 font-semibold",
    lg: "text-body-sm px-4 py-1.5 gap-2 font-bold",
  };

  const iconSizes = {
    sm: "w-3 h-3 min-w-[12px] min-h-[12px]",
    default: "w-3.5 h-3.5 min-w-[14px] min-h-[14px]",
    lg: "w-4 h-4 min-w-[16px] min-h-[16px]",
  };

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        "inline-flex items-center rounded-full select-none transition-all duration-200 uppercase tracking-wider font-mono",
        sizeClasses[size],
        config.containerClass,
        interactive &&
          "cursor-pointer hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-lime",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:shrink-0",
          iconSizes[size]
        )}
      >
        {config.icon}
      </span>
      <span className="leading-none whitespace-nowrap">{config.label}</span>
      {evidenceCount !== undefined && evidenceCount > 0 && (
        <span
          className={cn(
            "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold leading-none",
            config.evidenceClass
          )}
          title={`${evidenceCount} evidence quote(s)`}
        >
          {evidenceCount}
        </span>
      )}
    </div>
  );
}
