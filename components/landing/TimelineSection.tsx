"use client";

import * as React from "react";
import { ChangeTimeline } from "@/components/ui-ordermind/ChangeTimeline";
import { TimelineDock } from "@/components/ui-ordermind/TimelineDock";

export function TimelineSection() {
  const [currentStep, setCurrentStep] = React.useState(2);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const allEvents = [
    {
      id: "evt_1",
      field: "quantity",
      previousValue: null,
      newValue: 100,
      unit: "units",
      timestamp: "14:10 PM",
      actor: "ai" as const,
      status: "CONFIRMED" as const,
      evidenceQuote: "Can we start with 100 units?",
    },
    {
      id: "evt_2",
      field: "dimensions",
      previousValue: "200 x 140 x 70 mm",
      newValue: "200 x 140 x 90 mm",
      unit: "height",
      timestamp: "14:16 PM",
      actor: "ai" as const,
      status: "INFERRED" as const,
      evidenceQuote: "Make it a little taller, about 90mm height so the jars fit.",
    },
    {
      id: "evt_3",
      field: "quantity",
      previousValue: 100,
      newValue: 500,
      unit: "units",
      timestamp: "14:24 PM",
      actor: "ai" as const,
      status: "INFERRED" as const,
      evidenceQuote: "Actually bump it up to 500 units instead of 100.",
    },
    {
      id: "evt_4",
      field: "material",
      previousValue: "300 GSM Matte",
      newValue: "350 GSM White SBS board",
      timestamp: "14:28 PM",
      actor: "human" as const,
      status: "CONFIRMED" as const,
      evidenceQuote: "Operator confirmed 350 GSM White SBS Board with customer.",
    },
  ];

  // Progressive events slice based on step
  const visibleEvents = allEvents.slice(0, currentStep + 1);

  React.useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev >= allEvents.length - 1 ? 0 : prev + 1));
    }, 2500);
    return () => clearInterval(timer);
  }, [isPlaying, allEvents.length]);

  return (
    <section className="py-20 md:py-28 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>04</span> • <span>Audit Trail & State Engine</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            Every change recorded like Git for packaging.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            Did the client ask for 100 units or 500? Did they increase the box height by 20mm or 40mm? OrderMind tracks every event with before and after diffs, timestamp, actor, and source evidence.
          </p>
        </div>

        {/* ChangeTimeline Showcase & Scrubber Dock */}
        <div className="space-y-6">
          <div className="rounded-card-lg border border-border bg-surface-elevated p-6 sm:p-8 shadow-soft">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
                Order Event Graph • Branching History
              </span>
              <span className="text-body-xs font-mono text-ink">
                Showing {visibleEvents.length} of {allEvents.length} events
              </span>
            </div>

            <ChangeTimeline events={visibleEvents} />
          </div>

          {/* Interactive Timeline Scrubber Dock */}
          <TimelineDock
            currentStep={currentStep}
            totalSteps={allEvents.length}
            onStepChange={setCurrentStep}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            stepLabels={[
              "Initial 100 units stated",
              "Height adjusted from 70mm to 90mm",
              "Quantity changed from 100 to 500 units",
              "350 GSM White SBS board confirmed",
            ]}
          />
        </div>
      </div>
    </section>
  );
}
