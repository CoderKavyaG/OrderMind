"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Play,
  Mic,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Ruler,
  Sparkles,
  Calendar,
  Package,
  CheckCircle2,
  ShieldCheck,
  Video,
} from "lucide-react";
import { TactileTile } from "@/components/ui-ordermind/TactileTile";

export function LandingHero() {
  const [videoModalOpen, setVideoModalOpen] = React.useState(false);
  const walkthroughVideoUrl = process.env.NEXT_PUBLIC_WALKTHROUGH_VIDEO_URL || "";

  return (
    <section className="relative pt-36 sm:pt-44 pb-20 md:pb-28 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
        {/* Top Eyebrow Pill — with clear space below sticky header */}
        <div className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 border border-border shadow-tactile mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <span className="flex h-2 w-2 rounded-full bg-brand-lime animate-pulse" />
          <span className="text-body-xs font-mono font-semibold uppercase tracking-wider text-ink">
            Packaging Manufacturing Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-display-md sm:text-display-lg lg:text-display-xl font-bold tracking-tight text-ink max-w-5xl mx-auto leading-[1.05]">
          Turn messy customer chats into production-ready orders.
        </h1>

        {/* Subhead */}
        <p className="mt-6 text-body-lg sm:text-xl text-ink-muted max-w-3xl mx-auto font-sans leading-relaxed">
          WhatsApp texts, voice notes and photos in; one verified, evidence-backed order and production brief out.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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

          <Button
            variant="secondary"
            size="lg"
            onClick={() => setVideoModalOpen(true)}
            className="rounded-full shadow-tactile gap-2 text-ink text-base px-7 h-12 border border-border bg-surface hover:bg-surface-muted"
          >
            <Play className="w-4 h-4 fill-current text-ink" />
            Watch the 90-second walkthrough
          </Button>
        </div>

        {/* 3D Centerpiece: Isometric Rigid Packaging Box on Lime Pad with Orbiting Tactile Spec Chips */}
        <div className="mt-16 sm:mt-24 relative max-w-3xl mx-auto h-[420px] sm:h-[480px] flex items-center justify-center select-none">
          {/* Signal Lime Glowing Base Pad */}
          <div className="absolute w-72 sm:w-96 h-28 sm:h-36 bg-brand-lime/40 blur-3xl rounded-full -bottom-4 transform scale-y-50 pointer-events-none" />
          <div className="absolute w-64 sm:w-80 h-16 sm:h-20 bg-brand-lime rounded-full border-2 border-brand-limeHover/80 shadow-tactile transform -rotate-12 translate-y-24 opacity-80 pointer-events-none" />

          {/* 3D Isometric Packaging Box */}
          <div className="relative z-10 w-64 sm:w-76 h-64 sm:h-76 flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <svg
              viewBox="0 0 320 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_25px_35px_rgba(20,21,15,0.18)]"
            >
              {/* Box Drop Shadow */}
              <ellipse cx="160" cy="270" rx="120" ry="24" fill="#14150F" fillOpacity="0.12" />

              {/* Bottom Base Tray (Isometric) */}
              <path
                d="M160 260 L40 195 L40 120 L160 185 Z"
                fill="#DDD9CD"
                stroke="#C8C4B6"
                strokeWidth="2"
              />
              <path
                d="M160 260 L280 195 L280 120 L160 185 Z"
                fill="#CBC5B6"
                stroke="#B8B2A2"
                strokeWidth="2"
              />

              {/* Lid (Slightly Ajar Telescoping Rigid Box) */}
              <path
                d="M160 170 L35 105 L35 80 L160 145 Z"
                fill="#E8E4DA"
                stroke="#D5D0C4"
                strokeWidth="2"
              />
              <path
                d="M160 170 L285 105 L285 80 L160 145 Z"
                fill="#D9D4C7"
                stroke="#C5C0B2"
                strokeWidth="2"
              />

              {/* Top Lid Surface */}
              <polygon
                points="160,35 285,100 160,165 35,100"
                fill="#F7F5EF"
                stroke="#E2DFD6"
                strokeWidth="2"
              />

              {/* Gold Foil Hot Stamp Spec Logo */}
              <polygon
                points="160,75 190,92 160,110 130,92"
                fill="url(#goldGradient)"
                stroke="#C59A30"
                strokeWidth="1.5"
                opacity="0.95"
              />
              <path
                d="M160 82 L180 93 L160 103 L140 93 Z"
                stroke="#FFFFFF"
                strokeWidth="1"
                opacity="0.6"
              />

              {/* Dimension Annotation Line */}
              <line x1="295" y1="85" x2="295" y2="195" stroke="#C8F135" strokeWidth="2" strokeDasharray="3 3" />
              <text x="302" y="145" fill="#14150F" fontSize="11" fontFamily="Geist Mono" fontWeight="600">
                90mm
              </text>

              <defs>
                <linearGradient id="goldGradient" x1="130" y1="75" x2="190" y2="110" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F9E27E" />
                  <stop offset="0.5" stopColor="#E4B740" />
                  <stop offset="1" stopColor="#B3861E" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* ORBITING TACTILE SPEC CHIPS (Floating around 3D Box) */}
          
          {/* 1. Voice Note (Top Left) */}
          <div className="absolute -top-2 left-2 sm:left-6 z-20 animate-in fade-in-0 slide-in-from-left-4 duration-700">
            <div className="flex items-center gap-2 p-1.5 pr-3.5 rounded-2xl bg-surface border border-border shadow-floating">
              <TactileTile
                size="sm"
                variant="lime"
                icon={<Mic className="w-4 h-4 text-ink" />}
              />
              <div className="text-left">
                <span className="text-[10px] font-mono text-ink-muted uppercase block leading-none font-bold">
                  Voice Note
                </span>
                <span className="text-body-xs font-bold text-ink leading-tight font-mono">
                  0:48 &ldquo;make taller&rdquo;
                </span>
              </div>
            </div>
          </div>

          {/* 2. Chat Quote Speech Bubble (Top Right) */}
          <div className="absolute top-0 right-4 sm:right-16 z-20 hidden sm:block animate-in fade-in-0 slide-in-from-right-4 duration-700">
            <div className="p-2 px-3 rounded-2xl bg-[#E8F8D0] border border-[#BDE82B] shadow-tactile text-left">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#4E7A0D]" />
                <span className="text-body-xs font-mono font-medium text-ink">
                  &ldquo;same material as last time please!&rdquo;
                </span>
              </div>
            </div>
          </div>

          {/* 3. Photo Reference (Mid Left) */}
          <div className="absolute top-28 sm:top-32 -left-2 sm:left-4 z-20 animate-in fade-in-0 slide-in-from-left-6 duration-700">
            <div className="flex items-center gap-2 p-1.5 pr-3.5 rounded-2xl bg-surface border border-border shadow-floating">
              <TactileTile
                size="sm"
                variant="light"
                icon={<ImageIcon className="w-4 h-4 text-[#7A8A3B]" />}
              />
              <div className="text-left">
                <span className="text-[10px] font-mono text-ink-muted uppercase block leading-none font-bold">
                  Photo
                </span>
                <span className="text-body-xs font-bold text-ink leading-tight font-mono">
                  Lid_Clasp.png
                </span>
              </div>
            </div>
          </div>

          {/* 4. Quantity (Mid-Top Right) */}
          <div className="absolute top-20 sm:top-24 right-2 sm:right-8 z-20 animate-in fade-in-0 slide-in-from-right-4 duration-700">
            <div className="flex items-center gap-2 p-1.5 pr-3.5 rounded-2xl bg-surface border border-border shadow-floating">
              <TactileTile
                size="sm"
                variant="light"
                icon={<Package className="w-4 h-4 text-[#1F8A4C]" />}
              />
              <div className="text-left">
                <span className="text-[10px] font-mono text-ink-muted uppercase block leading-none font-bold">
                  Quantity
                </span>
                <span className="text-body-xs font-bold text-ink leading-tight font-mono">
                  500 units
                </span>
              </div>
            </div>
          </div>

          {/* 5. CAD Dieline File (Mid-Bottom Right) */}
          <div className="absolute top-44 sm:top-48 right-0 sm:right-6 z-20 animate-in fade-in-0 slide-in-from-right-6 duration-700">
            <div className="flex items-center gap-2 p-1.5 pr-3.5 rounded-2xl bg-surface border border-border shadow-floating">
              <TactileTile
                size="sm"
                variant="light"
                icon={<FileText className="w-4 h-4 text-[#C93B2B]" />}
              />
              <div className="text-left">
                <span className="text-[10px] font-mono text-ink-muted uppercase block leading-none font-bold">
                  CAD File
                </span>
                <span className="text-body-xs font-bold text-ink leading-tight font-mono">
                  Dieline.pdf
                </span>
              </div>
            </div>
          </div>

          {/* 6. Dimensions (Bottom Left) */}
          <div className="absolute bottom-10 sm:bottom-12 left-4 sm:left-14 z-20 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 p-1.5 pr-3.5 rounded-2xl bg-surface border border-border shadow-floating">
              <TactileTile
                size="sm"
                variant="light"
                icon={<Ruler className="w-4 h-4 text-ink-muted" />}
              />
              <div className="text-left">
                <span className="text-[10px] font-mono text-ink-muted uppercase block leading-none font-bold">
                  Dimensions
                </span>
                <span className="text-body-xs font-bold text-ink leading-tight font-mono">
                  200x140x90 mm
                </span>
              </div>
            </div>
          </div>

          {/* 7. Finish Gold Foil (Bottom Right) */}
          <div className="absolute bottom-10 sm:bottom-12 right-4 sm:right-16 z-20 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 p-1.5 pr-3.5 rounded-2xl bg-surface border border-border shadow-floating">
              <TactileTile
                size="sm"
                variant="light"
                icon={<Sparkles className="w-4 h-4 text-[#D4A017]" />}
              />
              <div className="text-left">
                <span className="text-[10px] font-mono text-ink-muted uppercase block leading-none font-bold">
                  Finish
                </span>
                <span className="text-body-xs font-bold text-ink leading-tight font-mono">
                  Gold Foil
                </span>
              </div>
            </div>
          </div>

          {/* 8. Delivery Deadline Pill (Bottom Center) */}
          <div className="absolute -bottom-4 z-20 animate-in fade-in-0 slide-in-from-bottom-2 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-surface shadow-floating border border-ink-muted/40 text-body-xs font-mono font-bold">
              <Calendar className="w-3.5 h-3.5 text-brand-lime" />
              <span>Delivery: Friday 17 Oct</span>
            </div>
          </div>
        </div>

        {/* Micro-Trust Bar */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-body-xs text-ink-muted font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Evidence-Backed Truth</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Local Gemma Execution</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Multi-Tenant Tenant Isolation</span>
          </div>
        </div>
      </div>

      {/* Video Walkthrough Dialog Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-surface border border-border">
          <DialogHeader className="p-4 border-b border-border bg-surface-muted/50">
            <DialogTitle className="text-body-md font-display font-bold text-ink flex items-center gap-2">
              <Video className="w-4 h-4 text-brand-lime" />
              <span>OrderMind Product Walkthrough</span>
            </DialogTitle>
            <DialogDescription className="text-body-xs text-ink-muted">
              See how unstructured WhatsApp dumps turn into evidence-backed production briefs.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 bg-canvas flex flex-col items-center justify-center text-center min-h-[320px]">
            {walkthroughVideoUrl ? (
              <video
                src={walkthroughVideoUrl}
                controls
                autoPlay
                className="w-full rounded-xl border border-border shadow-tactile"
              />
            ) : (
              <div className="space-y-4 max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-brand-lime/20 border border-brand-lime/40 text-ink flex items-center justify-center mx-auto">
                  <Play className="w-6 h-6 fill-current text-ink" />
                </div>
                <h4 className="font-display font-bold text-ink text-body-md">
                  Recorded Walkthrough Pipeline
                </h4>
                <p className="text-body-xs text-ink-muted leading-relaxed">
                  Interactive video walkthrough demonstrates multi-tenant WhatsApp chat ingestion, 4-state deterministic spec reduction, side-by-side conflict resolution, and sealed PDF factory brief generation.
                </p>
                <div className="pt-2">
                  <Link href="/signup">
                    <Button
                      size="sm"
                      className="rounded-full bg-brand-lime hover:bg-brand-limeHover border border-[#BDE82B] text-slate-950 font-bold"
                    >
                      Get started
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
