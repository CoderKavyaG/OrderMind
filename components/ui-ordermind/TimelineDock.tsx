"use client";

import * as React from "react";
import { Play, Pause, SkipBack, SkipForward, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TimelineDockProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  stepLabels?: string[];
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  dark?: boolean;
  className?: string;
}

export function TimelineDock({
  currentStep,
  totalSteps,
  onStepChange,
  stepLabels = [],
  isPlaying = false,
  onTogglePlay,
  dark = true,
  className,
}: TimelineDockProps) {
  const progressPercent = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100;
  const currentLabel = stepLabels[currentStep] || `Event State #${currentStep + 1}`;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-card-lg border shadow-floating select-none",
        dark
          ? "bg-canvas-dark text-surface border-border-dark shadow-tactile-dark"
          : "bg-surface text-ink border-border shadow-soft",
        className
      )}
    >
      {/* Left: Event label & icon */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl border shrink-0",
            dark
              ? "bg-surface-dark border-border-dark text-brand-lime"
              : "bg-surface-muted border-border text-ink"
          )}
        >
          <History className="w-5 h-5" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-body-xs font-mono font-bold uppercase tracking-wider",
                dark ? "text-ink-darkMuted" : "text-ink-muted"
              )}
            >
              State Replay
            </span>
            <span className="rounded-full bg-brand-lime/20 px-2 py-0.2 text-[10px] font-mono font-bold text-brand-lime border border-brand-lime/40">
              v{currentStep + 1} / {Math.max(1, totalSteps)}
            </span>
          </div>
          <span
            className={cn(
              "text-body-sm font-semibold truncate max-w-[200px] sm:max-w-[280px]",
              dark ? "text-surface" : "text-ink"
            )}
          >
            {currentLabel}
          </span>
        </div>
      </div>

      {/* Center: Scrubber Slider with ticks */}
      <div className="flex-1 w-full max-w-md mx-2 flex flex-col gap-1.5">
        <div className="relative flex items-center h-6 cursor-pointer">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStep}
            onChange={(e) => onStepChange(Number(e.target.value))}
            className="w-full h-2 bg-surface-darkMuted rounded-full appearance-none cursor-pointer accent-[#C8F135] focus:outline-none"
          />
        </div>

        <div className="flex justify-between items-center px-1 text-[10px] font-mono text-ink-subtle">
          <span>Initial Ingest</span>
          <span className="flex items-center gap-1 text-brand-lime">
            <Sparkles className="w-2.5 h-2.5" /> Replaying events
          </span>
          <span>Confirmed Target</span>
        </div>
      </div>

      {/* Right: Playback Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="iconSm"
          disabled={currentStep <= 0}
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          className={cn(
            "rounded-full",
            dark ? "bg-surface-dark border-border-dark text-surface hover:bg-surface-darkMuted" : ""
          )}
          title="Previous Event Step"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </Button>

        {onTogglePlay && (
          <Button
            variant="default"
            size="sm"
            onClick={onTogglePlay}
            className="rounded-full h-8 px-3 gap-1.5 font-semibold"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Play
              </>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          size="iconSm"
          disabled={currentStep >= totalSteps - 1}
          onClick={() => onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
          className={cn(
            "rounded-full",
            dark ? "bg-surface-dark border-border-dark text-surface hover:bg-surface-darkMuted" : ""
          )}
          title="Next Event Step"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
