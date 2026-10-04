"use client";

import * as React from "react";
import { Play, Pause, Mic, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimChip } from "./ClaimChip";
import { cn } from "@/lib/utils";

export interface VoiceNoteBubbleProps {
  duration?: string; // e.g. "0:48"
  senderName: string;
  senderRole?: "customer" | "business";
  timestamp: string;
  transcript?: string;
  waveformBars?: number[];
  isTranscribing?: boolean;
  claims?: Array<{
    field: string;
    value: unknown;
    op: "set" | "delta" | "ref";
    confidence?: number;
    quote?: string;
  }>;
  onPlayToggle?: (playing: boolean) => void;
  className?: string;
}

export function VoiceNoteBubble({
  duration = "0:48",
  senderName,
  senderRole = "customer",
  timestamp,
  transcript = "Hello, for Aarav Prints box order, let's bump the quantity from 100 to 500 units and make it a little taller, about 90mm height with the matte finish.",
  waveformBars = [30, 45, 60, 25, 75, 90, 50, 40, 80, 65, 35, 70, 85, 40, 60, 95, 80, 50, 65, 45, 30, 70, 55, 35],
  isTranscribing = false,
  claims = [
    { field: "quantity", value: 500, op: "set", confidence: 0.96, quote: "bump the quantity from 100 to 500 units" },
    { field: "height", value: 90, op: "delta", confidence: 0.91, quote: "make it a little taller, about 90mm height" },
  ],
  onPlayToggle,
  className,
}: VoiceNoteBubbleProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<"1x" | "1.5x" | "2x">("1x");
  const [activeBar, setActiveBar] = React.useState(8);
  const [transcribingInternal, setTranscribingInternal] = React.useState(isTranscribing);

  React.useEffect(() => {
    setTranscribingInternal(isTranscribing);
  }, [isTranscribing]);

  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    onPlayToggle?.(next);
  };

  const cycleSpeed = () => {
    if (playbackSpeed === "1x") setPlaybackSpeed("1.5x");
    else if (playbackSpeed === "1.5x") setPlaybackSpeed("2x");
    else setPlaybackSpeed("1x");
  };

  const isCustomer = senderRole === "customer";

  return (
    <div
      className={cn(
        "flex flex-col max-w-md rounded-2xl p-3.5 border transition-all duration-200 select-none shadow-sm",
        isCustomer
          ? "bg-white text-ink border-[#E4E0D5] ml-0 mr-auto rounded-tl-xs"
          : "bg-[#D9FDD3] text-ink border-[#BDEBB4] mr-0 ml-auto rounded-tr-xs",
        className
      )}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F8A4C]/15 text-[#1F8A4C]">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="text-body-xs font-semibold text-ink">
            {senderName}
          </span>
          <span className="rounded-full bg-surface-muted px-2 py-0.2 text-[10px] font-mono text-ink-muted">
            Voice Note
          </span>
        </div>

        <span className="text-[11px] font-mono text-ink-subtle">
          {timestamp}
        </span>
      </div>

      {/* Audio Player Strip */}
      <div className="flex items-center gap-2.5 bg-[#F4F1EA] p-2.5 rounded-xl border border-[#E5E0D4]">
        {/* Play/Pause Button */}
        <Button
          variant="default"
          size="iconSm"
          onClick={togglePlay}
          className="rounded-full h-8 w-8 shrink-0 bg-ink hover:bg-ink-light text-white shadow-tactile"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </Button>

        {/* Waveform Visualization Bars */}
        <div className="flex-1 flex items-center gap-[3px] h-8 cursor-pointer px-1">
          {waveformBars.map((heightPercent, idx) => {
            const isPassed = idx <= activeBar;
            return (
              <div
                key={idx}
                onClick={() => setActiveBar(idx)}
                className={cn(
                  "flex-1 rounded-full transition-all duration-150",
                  transcribingInternal
                    ? "bg-[#1F8A4C] animate-pulse"
                    : isPassed
                    ? "bg-ink opacity-90"
                    : "bg-ink-subtle/30 opacity-60"
                )}
                style={{
                  height: `${Math.max(18, heightPercent)}%`,
                  animationDelay: `${idx * 40}ms`,
                }}
              />
            );
          })}
        </div>

        {/* Duration & Speed */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[11px] font-mono font-bold text-ink">
            {duration}
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            className="rounded-full bg-white px-1.5 py-0.2 text-[10px] font-mono font-bold text-ink-muted hover:text-ink border border-[#E0DCD2]"
          >
            {playbackSpeed}
          </button>
        </div>
      </div>

      {/* Transcribing Live State or Transcript Display */}
      {transcribingInternal ? (
        <div className="mt-2.5 p-2 rounded-xl bg-surface-muted/80 border border-border flex items-center gap-2 text-body-xs font-mono text-ink-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-lime" />
          <span>Transcribing voice note with Whisper / ElevenLabs...</span>
        </div>
      ) : (
        transcript && (
          <div className="mt-2.5 pt-2 border-t border-black/5 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#1F8A4C] font-semibold">
              <Sparkles className="w-3 h-3 text-[#1F8A4C]" />
              <span>Transcript &amp; Extracted Audio Claims</span>
            </div>
            <p className="text-[12px] font-mono leading-relaxed text-ink/90 bg-[#F4F1EA]/80 p-2 rounded-lg border border-[#E5E0D4]">
              &ldquo;{transcript}&rdquo;
            </p>

            {/* Extracted Claim Chips under Transcript */}
            {claims && claims.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono text-ink-muted block uppercase tracking-wider">
                  Extracted from audio:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {claims.map((claim, cIdx) => (
                    <ClaimChip
                      key={cIdx}
                      op={claim.op}
                      field={claim.field}
                      value={claim.value}
                      confidence={claim.confidence}
                      quote={claim.quote}
                      className="bg-white text-[11px] shadow-xs"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
