"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ArrowRight, ShieldCheck, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqAndFooter() {
  const faqs = [
    {
      q: "Does OrderMind replace our factory ERP or MIS?",
      a: "No. OrderMind acts as the intelligent intake layer before your ERP. Instead of estimators spending 48 hours transcribing WhatsApp chats into job tickets manually, OrderMind validates the specifications and outputs structured JSON and printable briefs that plug into your existing MIS.",
    },
    {
      q: "What happens if a customer sends a messy Hindi or Hinglish voice note?",
      a: "OrderMind's transcription handles conversational speech and code-switching naturally. Spoken phrases like 'bhai 100 ki jagah 500 kar dena aur thoda uncha banana' are transcribed verbatim and passed to Gemma, extracting quantity: 500 and height: +delta.",
    },
    {
      q: "Can the AI fabricate quantities, materials, or delivery dates?",
      a: "Never. The LLM is strictly constrained by a verification guard. Every extracted claim must point to a verbatim quote inside the customer's raw message. If the quote is missing or hallucinated, the claim is rejected. Furthermore, all inferred values require one-click human confirmation.",
    },
    {
      q: "How are CAD dielines, vector logos, and artwork PDFs stored?",
      a: "Uploaded customer files are chunked and streamed directly into your MongoDB GridFS storage under a strict 10MB limit. Zero paid S3 buckets or Cloudinary accounts are required.",
    },
    {
      q: "Is our customer conversation history and pricing data private?",
      a: "100% private. All database records are strictly isolated by workspaceId. When running Gemma locally via Ollama, zero bytes of customer chats ever leave your factory workstation or private server.",
    },
    {
      q: "Can we run OrderMind completely offline on a factory LAN?",
      a: "Yes. With local MongoDB and local Gemma running on an internal machine, the entire system operates without an internet connection, ideal for secure industrial manufacturing facilities.",
    },
  ];

  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  return (
    <div className="border-t border-border bg-canvas">
      {/* FAQ SECTION */}
      <section className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>11</span> • <span>Frequently Answered Questions</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-body-lg text-ink-muted">
            Everything you need to know about precision packaging extraction and deterministic order compilation.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;

            return (
              <div
                key={idx}
                className="rounded-card border border-border bg-surface p-5 transition-all shadow-soft"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex items-center justify-between w-full text-left font-display text-body-lg font-bold text-ink"
                >
                  <span>{faq.q}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-ink shrink-0 ml-4">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <p className="mt-3 text-body-sm text-ink-muted font-sans leading-relaxed pt-2 border-t border-border/60">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-card-lg border border-border bg-surface-elevated p-8 sm:p-14 text-center shadow-floating relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-lime/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-lime/40 px-3 py-1 text-body-xs font-mono font-bold text-ink border border-brand-lime">
              <Sparkles className="w-3.5 h-3.5" /> Ready for Production
            </span>

            <h2 className="font-display text-display-md sm:text-display-lg font-bold tracking-tight text-ink">
              Stop letting packaging orders slip through chat threads.
            </h2>

            <p className="text-body-lg text-ink-muted font-sans leading-relaxed">
              Create your converter workspace today to automate WhatsApp extraction, side-by-side conflict resolution, and deterministic factory briefs.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  variant="default"
                  size="lg"
                  className="rounded-full shadow-tactile font-bold gap-2 bg-brand-lime text-slate-950 hover:bg-brand-limeHover border border-[#BDE82B] text-base px-8 h-12"
                >
                  Get started
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Button>
              </Link>

              <Link href="/login">
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full shadow-tactile gap-2 text-ink text-base px-7 h-12 border border-border bg-surface hover:bg-surface-muted"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TACTILE FOOTER */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 bg-surface">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-lime text-ink shadow-tactile font-display font-extrabold text-base">
              OM
            </div>
            <div>
              <span className="font-display text-heading-sm font-bold text-ink block">
                OrderMind
              </span>
              <span className="text-[11px] font-mono text-ink-muted">
                Precision packaging orders from messy customer chats.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-body-sm font-medium text-ink-muted">
            <Link href="/workspace" className="hover:text-ink transition-colors">
              Workspace
            </Link>
            <Link href="/inbox" className="hover:text-ink transition-colors">
              Inbox
            </Link>
            <Link href="/orders" className="hover:text-ink transition-colors">
              Orders
            </Link>
            <Link href="/story" className="hover:text-ink transition-colors">
              Our story
            </Link>
            <Link href="/dev/components" className="hover:text-ink transition-colors">
              Design System
            </Link>
            <Link href="/login" className="hover:text-ink transition-colors">
              Sign In
            </Link>
          </div>

          <div className="text-[11px] font-mono text-ink-subtle text-center md:text-right">
            <div>Evidence-Backed & Human-Confirmed</div>
            <div className="mt-0.5">Open-Source Architecture • Zero Cloud Vendor Lock-In</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
