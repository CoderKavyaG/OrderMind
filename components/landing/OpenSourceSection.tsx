"use client";

import * as React from "react";
import { Terminal, Shield, Cpu, Lock, Sparkles, Check, AlertCircle } from "lucide-react";

export function OpenSourceSection() {
  return (
    <section id="open-source" className="py-20 md:py-28 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>08</span> • <span>Data Sovereignty & Open Weights</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            Open-source by design. Your data stays in your factory.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            Your client lists, custom tooling dielines, and trade pricing should never be sent to proprietary cloud black boxes. OrderMind runs on open weights like Google Gemma on your own local server or private cluster.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Pillar 1 */}
          <div className="rounded-card border border-border bg-surface-elevated p-6 shadow-soft space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lime text-ink font-bold shadow-tactile">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-display text-heading-md font-bold text-ink">
              Gemma Local Extraction
            </h3>
            <p className="text-body-sm text-ink-muted leading-relaxed font-sans">
              Run Gemma 2B or 9B on an on-premise workstation via Ollama or a private container. Zero third-party API dependencies required.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-card border border-border bg-surface-elevated p-6 shadow-soft space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lime text-ink font-bold shadow-tactile">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-display text-heading-md font-bold text-ink">
              100% Private Infrastructure
            </h3>
            <p className="text-body-sm text-ink-muted leading-relaxed font-sans">
              All WhatsApp chat dumps, customer identities, voice recordings, and CAD dielines remain inside your MongoDB database with strict tenant scoping.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-card border border-border bg-surface-elevated p-6 shadow-soft space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lime text-ink font-bold shadow-tactile">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-display text-heading-md font-bold text-ink">
              Zero Per-Seat Fees
            </h3>
            <p className="text-body-sm text-ink-muted leading-relaxed font-sans">
              No subscription tax, no per-token markup, and no vendor lock-in. Switch model providers or host entirely offline on your factory LAN.
            </p>
          </div>
        </div>

        {/* Honest Note: What AI Can and Cannot Do */}
        <div className="rounded-card-lg border border-border bg-surface-muted/60 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-brand-lime shrink-0" />
            <h3 className="font-display text-heading-md font-bold text-ink">
              An Honest Note on What the AI Can and Can&rsquo;t Do
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-body-sm">
            {/* What it CAN do */}
            <div className="rounded-card border border-[#BDE6CE] bg-[#E8F6EE]/60 p-5 space-y-2.5">
              <span className="font-mono text-body-xs font-bold uppercase tracking-wider text-[#1F8A4C] block">
                What OrderMind Does with Gemma
              </span>
              <ul className="space-y-2 text-ink">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#1F8A4C] shrink-0 mt-0.5" />
                  <span>Extracts stated quantities, dimensions, and materials with exact quotation evidence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#1F8A4C] shrink-0 mt-0.5" />
                  <span>Flags relative changes (&ldquo;taller&rdquo;, &ldquo;+200 extra&rdquo;) as INFERRED deltas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#1F8A4C] shrink-0 mt-0.5" />
                  <span>Blocks invented quotes by string-matching output back against raw customer messages.</span>
                </li>
              </ul>
            </div>

            {/* What it CANNOT do */}
            <div className="rounded-card border border-[#F8BDBD] bg-[#FDF2F2]/60 p-5 space-y-2.5">
              <span className="font-mono text-body-xs font-bold uppercase tracking-wider text-[#D64545] block">
                What the AI is Never Permitted to Do
              </span>
              <ul className="space-y-2 text-ink">
                <li className="flex items-start gap-2">
                  <span className="text-[#D64545] font-bold shrink-0">✕</span>
                  <span>Never invents unstated fields (e.g. missing deadlines remain MISSING).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D64545] font-bold shrink-0">✕</span>
                  <span>Never silently decides conflicts; contradictory statements are surfaced for human resolution.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D64545] font-bold shrink-0">✕</span>
                  <span>Never mutates the database directly; all updates pass through validated Zod claims and a pure reducer.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
