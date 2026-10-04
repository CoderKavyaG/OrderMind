"use client";

import * as React from "react";

export function SketchbookPipeline() {
  const steps = [
    {
      num: "01",
      title: "Chat Ingest",
      desc: "WhatsApp text, audio memos, and dieline photos normalize into a single internal stream.",
      svg: (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-24 stroke-ink stroke-[1.5]">
          {/* Chat bubble outline */}
          <path d="M20 25 C20 18, 25 15, 35 15 L125 15 C135 15, 140 18, 140 25 L140 55 C140 62, 135 65, 125 65 L45 65 L25 80 L28 65 L20 65 Z" strokeDasharray="3 2" />
          {/* Text lines */}
          <line x1="35" y1="30" x2="105" y2="30" />
          <line x1="35" y1="42" x2="85" y2="42" />
          {/* Audio mic symbol */}
          <circle cx="115" cy="40" r="10" stroke="#C8F135" strokeWidth="2" />
          <line x1="115" y1="36" x2="115" y2="44" stroke="#14150F" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "Gemma Extract",
      desc: "AI identifies packaging parameters and strictly attaches exact verbatim quotation evidence.",
      svg: (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-24 stroke-ink stroke-[1.5]">
          {/* Document box */}
          <rect x="30" y="15" width="80" height="70" rx="6" strokeDasharray="4 2" />
          <line x1="45" y1="30" x2="95" y2="30" />
          <line x1="45" y1="42" x2="80" y2="42" />
          <line x1="45" y1="54" x2="90" y2="54" stroke="#1F8A4C" />
          {/* Magnifying glass */}
          <circle cx="105" cy="50" r="18" stroke="#14150F" strokeWidth="2" fill="#F7F5EF" />
          <line x1="118" y1="63" x2="135" y2="80" stroke="#14150F" strokeWidth="3" />
          <path d="M100 45 L108 55 L112 48" stroke="#C8F135" strokeWidth="2" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Event Reducer",
      desc: "Mathematical pure reducer compiles chronological events into deterministic order fields.",
      svg: (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-24 stroke-ink stroke-[1.5]">
          {/* Node graph */}
          <circle cx="35" cy="50" r="8" fill="#F7F5EF" />
          <circle cx="80" cy="30" r="8" fill="#F7F5EF" />
          <circle cx="80" cy="70" r="8" fill="#F7F5EF" />
          <circle cx="125" cy="50" r="10" fill="#C8F135" />
          {/* Connectors */}
          <line x1="43" y1="46" x2="72" y2="34" strokeDasharray="3 3" />
          <line x1="43" y1="54" x2="72" y2="66" strokeDasharray="3 3" />
          <line x1="88" y1="34" x2="117" y2="46" />
          <line x1="88" y1="66" x2="117" y2="54" />
        </svg>
      ),
    },
    {
      num: "04",
      title: "Conflict Detect",
      desc: "Contradictory customer specs are captured side-by-side with quotes. No guessing allowed.",
      svg: (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-24 stroke-ink stroke-[1.5]">
          {/* Balance Scale */}
          <line x1="80" y1="20" x2="80" y2="80" strokeWidth="2" />
          <line x1="30" y1="35" x2="130" y2="35" strokeWidth="2" />
          <circle cx="80" cy="20" r="4" fill="#14150F" />
          {/* Left Pan */}
          <path d="M30 35 L20 60 L60 60 Z" fill="#FDF2F2" stroke="#D64545" />
          {/* Right Pan */}
          <path d="M130 35 L100 60 L140 60 Z" fill="#E8F6EE" stroke="#1F8A4C" />
          <line x1="80" y1="80" x2="60" y2="85" />
          <line x1="80" y1="80" x2="100" y2="85" />
        </svg>
      ),
    },
    {
      num: "05",
      title: "Human Confirm",
      desc: "Estimators confirm inferred adjustments with one click, locking the audited specification.",
      svg: (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-24 stroke-ink stroke-[1.5]">
          {/* Seal Stamp */}
          <circle cx="80" cy="45" r="26" stroke="#C8F135" strokeWidth="3" strokeDasharray="4 2" />
          <circle cx="80" cy="45" r="20" stroke="#14150F" strokeWidth="1.5" />
          <path d="M72 45 L77 50 L88 38" stroke="#1F8A4C" strokeWidth="2.5" />
          {/* Signature Line */}
          <path d="M45 82 Q 70 70, 90 85 T 125 80" stroke="#14150F" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      num: "06",
      title: "Factory Brief",
      desc: "Sealed production brief unlocks for die-makers, sheet cutter operators, and plate imaging.",
      svg: (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-24 stroke-ink stroke-[1.5]">
          {/* Packaging Dieline Box Flat Pattern */}
          <rect x="55" y="30" width="50" height="40" stroke="#14150F" strokeWidth="1.5" fill="#F7F5EF" />
          <rect x="25" y="30" width="30" height="40" stroke="#14150F" strokeWidth="1" strokeDasharray="3 3" />
          <rect x="105" y="30" width="30" height="40" stroke="#14150F" strokeWidth="1" strokeDasharray="3 3" />
          <rect x="55" y="10" width="50" height="20" stroke="#14150F" strokeWidth="1" strokeDasharray="3 3" />
          <rect x="55" y="70" width="50" height="20" stroke="#14150F" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="80" cy="50" r="6" fill="#C8F135" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 md:py-28 border-t border-border bg-canvas">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>09</span> • <span>The Sketchbook Pipeline</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            How OrderMind transforms the factory workflow.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            Six disciplined stages connect informal customer conversations to flawless die-cut manufacturing.
          </p>
        </div>

        {/* 6 Sketchbook Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="rounded-card border border-border bg-surface p-6 shadow-soft hover:shadow-tactile-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
                  <span className="text-body-xs font-mono font-bold text-ink-muted">
                    STEP {step.num}
                  </span>
                  <span className="font-display text-heading-sm font-bold text-ink">
                    {step.title}
                  </span>
                </div>

                <div className="p-3 rounded-card-sm bg-surface-muted/40 border border-border/60 mb-4 flex items-center justify-center">
                  {step.svg}
                </div>

                <p className="text-body-sm text-ink-muted leading-relaxed font-sans">
                  {step.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-ink-subtle">
                <span>Phase {idx + 1}</span>
                <span className="text-brand-ink font-semibold">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
