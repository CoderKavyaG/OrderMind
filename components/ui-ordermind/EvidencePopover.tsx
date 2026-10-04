"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Quote, ExternalLink, ShieldCheck, Clock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EvidenceItem {
  messageId?: string;
  quote: string;
  sender?: string;
  timestamp?: string;
  confidence?: number;
  actor?: "ai" | "human";
}

export interface EvidencePopoverProps {
  evidence: EvidenceItem;
  trigger?: React.ReactNode;
  onJumpToMessage?: (messageId: string) => void;
  className?: string;
}

export function EvidencePopover({
  evidence,
  trigger,
  onJumpToMessage,
  className,
}: EvidencePopoverProps) {
  const confidencePercent =
    evidence.confidence !== undefined
      ? Math.round(evidence.confidence > 1 ? evidence.confidence : evidence.confidence * 100)
      : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-body-xs font-mono font-medium text-ink-muted bg-surface-muted hover:bg-[#DDD9CE] hover:text-ink transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
          >
            <Quote className="w-3 h-3 text-ink-subtle" />
            <span>Evidence</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-80 p-4 rounded-card border-border bg-surface shadow-floating", className)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <div className="flex items-center gap-1.5">
              <Quote className="w-4 h-4 text-brand-ink" />
              <span className="text-body-xs font-semibold tracking-wider text-ink uppercase">
                Customer Quote
              </span>
            </div>
            {confidencePercent !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime/30 px-2 py-0.5 text-[11px] font-mono font-semibold text-ink border border-brand-lime/50">
                <ShieldCheck className="w-3 h-3 text-[#1F8A4C]" />
                {confidencePercent}% match
              </span>
            )}
          </div>

          {/* Verbatim Quote in Geist Mono 13px */}
          <div className="relative rounded-card-sm border border-border bg-surface-muted/60 p-3">
            <p className="font-mono text-mono-evidence text-ink leading-relaxed italic">
              &ldquo;{evidence.quote}&rdquo;
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-body-xs text-ink-muted pt-1">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-ink flex items-center gap-1">
                {evidence.actor === "human" ? (
                  <>
                    <UserCheck className="w-3 h-3 text-brand-lime" /> Confirmed by operator
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-ink-subtle" />
                    {evidence.sender || "Customer Chat"}
                  </>
                )}
              </span>
              {evidence.timestamp && (
                <span className="text-[11px] text-ink-subtle font-mono">
                  {evidence.timestamp}
                </span>
              )}
            </div>

            {evidence.messageId && onJumpToMessage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] gap-1 rounded-full hover:bg-surface-muted text-ink"
                onClick={() => onJumpToMessage(evidence.messageId!)}
              >
                Jump to chat
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
