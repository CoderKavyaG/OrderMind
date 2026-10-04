"use client";

import * as React from "react";
import { VoiceNoteBubble } from "@/components/ui-ordermind/VoiceNoteBubble";
import { ClaimChip } from "@/components/ui-ordermind/ClaimChip";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Sparkles, Mic, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoiceNotesSection() {
  const fullTranscript =
    "Hello team! For Aarav Prints perfume gift box batch, let's bump the quantity up to 500 units, and make it a little taller, about 90mm height with the same matte finish.";

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [typedText, setTypedText] = React.useState(fullTranscript);
  const [showChips, setShowChips] = React.useState(true);

  const startDemo = () => {
    setIsPlaying(true);
    setTypedText("");
    setShowChips(false);

    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      setTypedText(fullTranscript.slice(0, index));
      if (index >= fullTranscript.length) {
        clearInterval(interval);
        setIsPlaying(false);
        setShowChips(true);
      }
    }, 40);
  };

  return (
    <section className="py-20 md:py-28 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>06</span> • <span>Voice Intelligence</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            Spoken voice notes in. Structured specifications out.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            Converters receive dozen-second voice memos from clients while on the production floor or driving. OrderMind transcribes them locally and passes the text directly into the Gemma extraction pipeline.
          </p>
        </div>

        {/* Live Audio Transcription Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Audio Waveform Player (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-card-lg border border-border bg-surface-elevated p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
                  Audio Memo Stream
                </span>
                <span className="rounded-full bg-brand-lime/20 px-2 py-0.5 text-[10px] font-mono font-bold text-ink">
                  Whisper Sync
                </span>
              </div>

              <VoiceNoteBubble
                duration="0:48"
                senderName="Aarav Sharma"
                senderRole="customer"
                timestamp="14:16 PM"
                transcript={typedText}
                onPlayToggle={(playing) => {
                  if (playing) startDemo();
                  else setIsPlaying(false);
                }}
              />

              <div className="pt-2 flex justify-center">
                <Button
                  variant={isPlaying ? "secondary" : "default"}
                  size="sm"
                  onClick={startDemo}
                  className="rounded-full font-semibold gap-1.5 shadow-tactile"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Replaying Audio Memo...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Play & Transcribe Voice Memo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Claims Lighting Up (7 cols) */}
          <div className="lg:col-span-7 rounded-card-lg border border-border bg-[#EFECE3] p-6 sm:p-7 shadow-soft space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-lime text-ink font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink">
                  Extracted Claims from Voice Stream
                </span>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">
                3 Claims Verified
              </span>
            </div>

            {/* Transcript Display Box */}
            <div className="rounded-card border border-border bg-surface p-4 min-h-[90px] flex items-center">
              {typedText ? (
                <p className="font-mono text-mono-evidence text-ink leading-relaxed italic">
                  &ldquo;{typedText}&rdquo;
                  {isPlaying && <span className="inline-block w-2 h-4 bg-brand-lime ml-1 animate-pulse" />}
                </p>
              ) : (
                <span className="text-body-xs font-mono text-ink-subtle italic">
                  Click &ldquo;Play & Transcribe&rdquo; on the left to start live audio extraction...
                </span>
              )}
            </div>

            {/* Claims Stack */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Validated Claims (Linked to Audio Timeline)
              </span>

              <div className={cn("flex flex-wrap gap-2.5 transition-all duration-500", showChips ? "opacity-100 translate-y-0" : "opacity-30 translate-y-2")}>
                <ClaimChip
                  op="set"
                  field="quantity"
                  value={500}
                  unit="units"
                  quote="bump the quantity up to 500 units"
                  confidence={0.98}
                />
                <ClaimChip
                  op="delta"
                  field="height"
                  value="+20mm"
                  unit="90mm total"
                  quote="make it a little taller, about 90mm height"
                  confidence={0.95}
                />
                <ClaimChip
                  op="ref"
                  field="finish"
                  value="Order #1042 Matte"
                  quote="same matte finish"
                  confidence={0.93}
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] font-mono text-ink-muted flex items-center justify-between border-t border-border/80">
              <span>Whisper / ElevenLabs Transcriber</span>
              <span className="text-ink font-semibold">Zero Invented Claims</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
