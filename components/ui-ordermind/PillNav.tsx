"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PillNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
  badge?: string;
  disabled?: boolean;
}

export interface PillNavProps {
  items: PillNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "lime" | "dark" | "surface";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function PillNav({
  items,
  activeId,
  onChange,
  variant = "lime",
  size = "default",
  className,
}: PillNavProps) {
  const sizeClasses = {
    sm: "h-9 p-1 gap-1 text-body-xs",
    default: "h-11 p-1.5 gap-1.5 text-body-sm",
    lg: "h-13 p-2 gap-2 text-body-lg",
  };

  const itemPadding = {
    sm: "px-3 py-1",
    default: "px-4 py-1.5",
    lg: "px-5 py-2",
  };

  return (
    <nav
      role="tablist"
      aria-label="Navigation Tabs"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface-muted/70 shadow-tactile select-none max-w-full overflow-x-auto no-scrollbar",
        sizeClasses[size],
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-lime",
              itemPadding[size],
              isActive
                ? variant === "lime"
                  ? "bg-brand-lime text-ink font-semibold shadow-tactile border border-brand-lime/80"
                  : variant === "dark"
                  ? "bg-ink text-surface font-semibold shadow-tactile-dark"
                  : "bg-surface-elevated text-ink font-semibold shadow-tactile border border-border"
                : "text-ink-muted hover:text-ink hover:bg-surface/60",
              item.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
          >
            {item.icon && <span className="mr-1.5 shrink-0">{item.icon}</span>}
            <span>{item.label}</span>

            {item.count !== undefined && (
              <span
                className={cn(
                  "ml-2 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold leading-none",
                  isActive
                    ? "bg-ink/15 text-ink"
                    : "bg-surface text-ink-muted border border-border/80"
                )}
              >
                {item.count}
              </span>
            )}

            {item.badge && (
              <span className="ml-1.5 text-[10px] font-bold text-[#D64545]">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
