"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TactileTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: "light" | "dark" | "lime" | "sunken";
  size?: "sm" | "default" | "lg" | "xl";
  badge?: string | number;
  active?: boolean;
}

export function TactileTile({
  icon,
  variant = "light",
  size = "default",
  badge,
  active = false,
  className,
  ...props
}: TactileTileProps) {
  const sizeClasses = {
    sm: "w-9 h-9 rounded-xl text-sm",
    default: "w-12 h-12 rounded-2xl text-base",
    lg: "w-14 h-14 rounded-2xl text-lg",
    xl: "w-16 h-16 rounded-3xl text-xl",
  };

  const variantClasses = {
    light:
      "bg-gradient-to-b from-[#FFFFFF] to-[#F7F5EF] text-ink border border-border shadow-tactile hover:shadow-tactile-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-tactile-pressed",
    dark:
      "bg-gradient-to-b from-[#26291F] to-[#1C1E16] text-surface border border-[#2A2D23] shadow-tactile-dark hover:-translate-y-0.5 active:translate-y-0 active:shadow-inner",
    lime:
      "bg-gradient-to-b from-[#D8FA48] to-[#C8F135] text-ink border border-[#BCE726] shadow-tactile hover:shadow-tactile-hover hover:-translate-y-0.5 active:translate-y-0 font-bold",
    sunken:
      "bg-surface-muted text-ink-muted border border-border/80 shadow-[inset_0_2px_4px_rgba(20,21,15,0.08)]",
  };

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex items-center justify-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-lime select-none",
        sizeClasses[size],
        variantClasses[variant],
        active && "ring-2 ring-brand-lime ring-offset-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center shrink-0">
        {icon}
      </div>

      {badge !== undefined && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-lime px-1 text-[10px] font-mono font-bold text-ink shadow-sm border border-brand-limeHover">
          {badge}
        </span>
      )}
    </button>
  );
}
