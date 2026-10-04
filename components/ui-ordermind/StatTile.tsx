"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  delta?: {
    value: string | number;
    trend?: "up" | "down" | "neutral" | "alert";
    label?: string;
  };
  icon?: React.ReactNode;
  subtitle?: string;
  dark?: boolean;
}

export function StatTile({
  value,
  label,
  delta,
  icon,
  subtitle,
  dark = false,
  className,
  ...props
}: StatTileProps) {
  const trendClasses = {
    up: "bg-brand-lime/40 text-ink border-brand-lime/60",
    down: "bg-status-conflicting/15 text-status-conflicting border-status-conflicting/30",
    neutral: "bg-surface-muted text-ink-muted border-border",
    alert: "bg-[#FDF2F2] text-[#D64545] border-[#F8BDBD]",
  };

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between p-6 rounded-card border transition-all duration-200 select-none",
        dark
          ? "bg-ink text-surface border-ink/40 shadow-tactile-dark"
          : "bg-surface text-ink border-border shadow-soft hover:shadow-tactile-hover hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {/* Top Header: Delta pill and optional Icon */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-body-xs font-semibold uppercase tracking-wider",
            dark ? "text-ink-darkMuted" : "text-ink-muted"
          )}
        >
          {label}
        </span>

        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl border shrink-0",
              dark
                ? "bg-surface-dark border-border-dark text-brand-lime"
                : "bg-surface-elevated border-border text-ink shadow-tactile"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Giant Stat Number (Funnel Display 700) */}
      <div className="my-3 flex items-baseline gap-3">
        <span
          className={cn(
            "font-display text-display-md tracking-tight leading-none",
            dark ? "text-surface" : "text-ink"
          )}
        >
          {value}
        </span>

        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-xs font-mono font-semibold border",
              trendClasses[delta.trend || "neutral"]
            )}
          >
            {delta.trend === "up" && <ArrowUpRight className="w-3 h-3 text-[#1F8A4C]" />}
            {delta.trend === "down" && <ArrowDownRight className="w-3 h-3 text-[#D64545]" />}
            <span>{delta.value}</span>
            {delta.label && <span className="font-normal opacity-80">{delta.label}</span>}
          </span>
        )}
      </div>

      {/* Optional Subtitle / Status note */}
      {subtitle && (
        <p
          className={cn(
            "text-body-xs truncate",
            dark ? "text-ink-darkMuted" : "text-ink-subtle"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
