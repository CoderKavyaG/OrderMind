"use client";

import * as React from "react";
import { GitCommit, Sparkles, UserCheck, ArrowRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  field: string;
  previousValue?: string | number | null;
  newValue: string | number;
  unit?: string;
  timestamp: string;
  actor: "ai" | "human";
  status?: "CONFIRMED" | "INFERRED" | "CONFLICTING";
  evidenceQuote?: string;
  messageId?: string;
}

export interface ChangeTimelineProps {
  events: TimelineEvent[];
  onSelectEvent?: (event: TimelineEvent) => void;
  className?: string;
}

export function ChangeTimeline({
  events,
  onSelectEvent,
  className,
}: ChangeTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-body-sm text-ink-muted bg-surface-muted/30 rounded-card border border-dashed border-border">
        No specification changes recorded yet.
      </div>
    );
  }

  return (
    <div className={cn("relative pl-6 space-y-6", className)}>
      {/* Continuous Git Connector Spine */}
      <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-border" />

      {events.map((event, index) => {
        const isHuman = event.actor === "human";
        const hasPrev = event.previousValue !== undefined && event.previousValue !== null;

        return (
          <div
            key={event.id || index}
            onClick={() => onSelectEvent?.(event)}
            className="group relative flex items-start gap-4 cursor-pointer"
          >
            {/* Git Node Circle */}
            <div
              className={cn(
                "relative z-10 flex h-6 w-6 -ml-[23px] items-center justify-center rounded-full border-2 transition-transform duration-200 group-hover:scale-125",
                isHuman
                  ? "bg-brand-lime border-ink text-ink shadow-sm"
                  : event.status === "CONFIRMED"
                  ? "bg-[#E8F6EE] border-[#1F8A4C] text-[#1F8A4C]"
                  : "bg-surface border-border text-ink-muted"
              )}
            >
              {isHuman ? (
                <UserCheck className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <GitCommit className="w-3 h-3" />
              )}
            </div>

            {/* Event Card Content */}
            <div className="flex-1 rounded-card border border-border bg-surface p-4 shadow-soft transition-all duration-200 group-hover:shadow-tactile-hover group-hover:border-[#C8E08C]">
              {/* Header: Field, Actor Badge, Timestamp */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink bg-surface-muted px-2 py-0.5 rounded-full border border-border">
                    {event.field}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[11px] font-medium",
                      isHuman
                        ? "bg-brand-lime/30 text-ink font-semibold border border-brand-lime/50"
                        : "bg-surface-muted text-ink-muted"
                    )}
                  >
                    {isHuman ? <UserCheck className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                    {isHuman ? "Human Confirmed" : "Gemma Extracted"}
                  </span>
                </div>

                <span className="text-[11px] text-ink-subtle font-mono">
                  {event.timestamp}
                </span>
              </div>

              {/* Value Diff */}
              <div className="flex items-center gap-2 text-body-sm font-sans flex-wrap my-1.5">
                {hasPrev && (
                  <>
                    <span className="line-through text-ink-subtle font-mono">
                      {String(event.previousValue)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                  </>
                )}
                <span className="font-semibold text-ink font-mono bg-brand-lime/20 px-2 py-0.5 rounded-md border border-brand-lime/40">
                  {String(event.newValue)} {event.unit && <span className="font-normal text-ink-muted">{event.unit}</span>}
                </span>
              </div>

              {/* Evidence Quote */}
              {event.evidenceQuote && (
                <div className="mt-2.5 flex items-start gap-1.5 text-mono-evidence font-mono italic text-ink-muted bg-surface-muted/60 p-2 rounded-xl border border-border/80">
                  <Quote className="w-3 h-3 text-ink-subtle shrink-0 mt-0.5" />
                  <span className="line-clamp-2">&ldquo;{event.evidenceQuote}&rdquo;</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
