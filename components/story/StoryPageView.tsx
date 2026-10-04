"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Quote,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  ExternalLink,
  Lock,
  GitCommit,
  Terminal,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORY_CONTENT, StoryBlock, getStoryBlock } from "@/content/story";

interface StoryPageViewProps {
  isPreview?: boolean;
}

export function StoryPageView({ isPreview = false }: StoryPageViewProps) {
  const config = STORY_CONTENT;

  // Helper to render block with preview badge if unverified
  const renderBlock = (blockId: string, fallbackClassName = "text-body-base text-ink-muted") => {
    const block = getStoryBlock(blockId, isPreview);
    if (!block) return null;

    return (
      <div className="relative">
        <p className={fallbackClassName}>{block.text}</p>
        {isPreview && !block.verified && (
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3" /> Unverified (source: {block.source})
          </span>
        )}
      </div>
    );
  };

  const heroSubline = getStoryBlock(config.hero.sublineBlockId, isPreview);
  const verifiedQuotes = config.problemQuotes.filter((q) => isPreview || q.verified);

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-brand-lime selection:text-ink font-sans">
      {/* PREVIEW BANNER */}
      {isPreview && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-center text-xs font-mono font-bold flex items-center justify-center gap-2 border-b border-amber-500 sticky top-0 z-50">
          <AlertTriangle className="w-4 h-4" />
          <span>DEVELOPER PREVIEW MODE: Showing verified and unverified story blocks with provenance tags.</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body-xs font-mono font-medium text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to OrderMind
          </Link>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-lime/20 px-3 py-1 text-body-xs font-mono font-bold text-ink border border-brand-lime/40 flex items-center gap-1.5">
              <span>Our story</span>
            </span>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-body-xs font-semibold">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="default" size="sm" className="rounded-full bg-brand-lime text-slate-950 font-bold hover:bg-brand-limeHover border border-[#BDE82B] text-body-xs">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 md:py-16 space-y-20">
        {/* SECTION 1: HERO */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse" />
            <span>{config.event}</span>
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="font-display text-display-md md:text-display-lg font-bold text-ink tracking-tight leading-tight">
              {config.consentToName ? config.hero.title : "Built for a packaging founder."}
            </h1>

            {heroSubline && (
              <div className="relative">
                <p className="text-body-lg md:text-display-xs text-ink-muted font-sans leading-relaxed">
                  {heroSubline.text}
                </p>
                {isPreview && !heroSubline.verified && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900">
                    Unverified
                  </span>
                )}
              </div>
            )}

            {config.consentToName && (
              <div className="flex flex-wrap items-center gap-2 pt-2 text-body-xs font-mono text-ink-muted">
                <span>Friend:</span>
                <a
                  href={config.friendPortfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-ink hover:underline inline-flex items-center gap-1"
                >
                  {config.friendName} <ExternalLink className="w-3 h-3 text-ink-muted" />
                </a>
                <span>&bull;</span>
                <span className="font-medium text-ink">{config.companyName}</span>
                <span>({config.companyFocus})</span>
              </div>
            )}
          </div>

          {/* REAL PACKAGING PHOTO */}
          {config.packagingPhotoUrl && (
            <div className="pt-4">
              <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-card-lg overflow-hidden border border-border shadow-floating bg-surface-muted">
                <Image
                  src={config.packagingPhotoUrl}
                  alt={config.packagingPhotoAlt || "Packaging photo"}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-[11px] font-mono">
                  <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    InTheBox &bull; Custom Structural Packaging & Manufacturing
                  </span>
                  <span className="hidden sm:inline-block bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    Rigid Boxes &bull; Corrugated &bull; Folding Cartons
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: THE PROBLEM IN HIS WORDS */}
        <section className="space-y-6">
          <div className="border-b border-border pb-4">
            <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-brand-limeDark block">
              Section 02 &bull; Direct Quotes
            </span>
            <h2 className="font-display text-heading-lg sm:text-display-md font-bold text-ink tracking-tight mt-1">
              The problem, in his words.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {verifiedQuotes.map((quote) => (
              <div
                key={quote.id}
                className="p-6 rounded-card-lg bg-surface border border-border shadow-soft flex flex-col justify-between space-y-4 relative"
              >
                <div className="space-y-3">
                  <Quote className="w-6 h-6 text-brand-lime fill-brand-lime/20" />
                  <p className="text-body-sm text-ink font-medium leading-relaxed italic">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-border/80 flex items-center justify-between text-body-xs font-mono text-ink-muted">
                  <div>
                    <div className="font-bold text-ink">{quote.author || "Ishan Kumar"}</div>
                    <div className="text-[11px]">{quote.context || "InTheBox"}</div>
                  </div>
                  {isPreview && !quote.verified && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-200 text-amber-900 font-bold">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: WHAT WE HEARD, WHAT WE BUILT */}
        <section className="space-y-6">
          <div className="border-b border-border pb-4">
            <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-brand-limeDark block">
              Section 03 &bull; Feature Mapping
            </span>
            <h2 className="font-display text-heading-lg sm:text-display-md font-bold text-ink tracking-tight mt-1">
              What we heard. What we built.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.whatWeBuiltCards.map((card) => {
              const heardBlock = getStoryBlock(card.heardBlockId, isPreview);
              const builtBlock = getStoryBlock(card.builtBlockId, isPreview);

              if (!heardBlock && !builtBlock && !isPreview) return null;

              return (
                <div
                  key={card.id}
                  className="p-6 rounded-card-lg bg-surface border border-border shadow-soft flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-surface-muted border border-border text-[11px] font-mono font-semibold text-ink-muted">
                      {card.tag}
                    </span>

                    {/* What we heard */}
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                      <div className="text-[11px] font-mono font-bold text-amber-800">
                        {card.heardTitle}
                      </div>
                      {heardBlock && (
                        <p className="text-body-xs text-ink-muted leading-relaxed italic">
                          &ldquo;{heardBlock.text}&rdquo;
                        </p>
                      )}
                      {isPreview && heardBlock && !heardBlock.verified && (
                        <span className="text-[9px] font-mono bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-bold">
                          Unverified
                        </span>
                      )}
                    </div>

                    {/* What we built */}
                    <div className="space-y-2">
                      <div className="font-display font-bold text-body-sm text-ink flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-brand-lime fill-brand-lime" />
                        <span>{card.builtTitle}</span>
                      </div>
                      {builtBlock && (
                        <p className="text-body-xs text-ink-muted leading-relaxed">
                          {builtBlock.text}
                        </p>
                      )}
                      {isPreview && builtBlock && !builtBlock.verified && (
                        <span className="text-[9px] font-mono bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-bold">
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  <Link href={card.featureLink} className="pt-2">
                    <Button variant="outline" size="sm" className="w-full justify-between rounded-xl font-mono text-body-xs">
                      <span>{card.featureLinkLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: WHY OPEN SOURCE MATTERS HERE */}
        <section className="p-8 md:p-10 rounded-card-lg bg-ink text-surface border border-ink/40 shadow-tactile-dark space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 border border-white/20 text-body-xs font-mono text-brand-lime">
              <Cpu className="w-3.5 h-3.5" />
              <span>Section 04 &bull; Open-Source AI Architecture</span>
            </div>
            <h2 className="font-display text-heading-lg sm:text-display-md font-bold text-white tracking-tight">
              {config.openSourceSection.title}
            </h2>
            {renderBlock(
              config.openSourceSection.gemmaExplanationBlockId,
              "text-body-base text-white/80 font-sans leading-relaxed max-w-3xl"
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Capabilities */}
            <div className="p-6 rounded-card bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 font-display font-bold text-body-sm text-brand-lime">
                <CheckCircle2 className="w-4 h-4" />
                <span>What the AI Honestly Does</span>
              </div>
              {renderBlock(
                config.openSourceSection.aiCapabilitiesBlockId,
                "text-body-xs text-white/75 leading-relaxed font-sans"
              )}
            </div>

            {/* Limitations & Guardrails */}
            <div className="p-6 rounded-card bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 font-display font-bold text-body-sm text-white">
                <Lock className="w-4 h-4 text-brand-lime" />
                <span>What the AI Never Does</span>
              </div>
              {renderBlock(
                config.openSourceSection.aiLimitationsBlockId,
                "text-body-xs text-white/75 leading-relaxed font-sans"
              )}
            </div>
          </div>
        </section>

        {/* SECTION 5: HOW WE BUILT IT (REAL PHASES & NUMBERS) */}
        <section className="space-y-6">
          <div className="border-b border-border pb-4">
            <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-brand-limeDark block">
              Section 05 &bull; Real Build Log & Repository Facts
            </span>
            <h2 className="font-display text-heading-lg sm:text-display-md font-bold text-ink tracking-tight mt-1">
              How we built it: Phase by phase.
            </h2>
            <p className="text-body-sm text-ink-muted mt-1 font-sans">
              All numbers and milestones read directly from repository tests and architecture invariants. Zero fabricated claims.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.buildLogTimeline.map((step, idx) => {
              const descBlock = getStoryBlock(step.descriptionBlockId, isPreview);
              if (!descBlock && !isPreview) return null;

              return (
                <div
                  key={idx}
                  className="p-5 rounded-card bg-surface border border-border shadow-soft flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-body-xs font-mono font-bold text-brand-limeDark">
                        {step.phase}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-muted border border-border text-ink-muted">
                        {step.stat}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-body-base text-ink">
                      {step.name}
                    </h4>
                    {descBlock && (
                      <p className="text-body-xs text-ink-muted leading-relaxed font-sans">
                        {descBlock.text}
                      </p>
                    )}
                  </div>
                  {isPreview && descBlock && !descBlock.verified && (
                    <span className="text-[9px] font-mono bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-bold self-start">
                      Unverified
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 6: AFTER HE TRIED IT (RENDER ONLY IF VERIFIED) */}
        {config.afterTriedItReaction && (isPreview || config.afterTriedItReaction.verified) && (
          <section className="p-8 rounded-card-lg bg-surface border border-border shadow-soft space-y-4">
            <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-brand-limeDark block">
              Section 06 &bull; Reaction
            </span>
            <h3 className="font-display font-bold text-heading-md text-ink">
              After he tried it.
            </h3>
            <p className="text-body-base text-ink-muted font-sans leading-relaxed italic">
              &ldquo;{config.afterTriedItReaction.text}&rdquo;
            </p>
            {isPreview && !config.afterTriedItReaction.verified && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300">
                Unverified Reaction
              </span>
            )}
          </section>
        )}

        {/* FOOTER CTA */}
        <section className="py-8 border-t border-border">
          <div className="rounded-card-lg bg-surface-elevated border border-border p-8 md:p-12 text-center shadow-floating space-y-6">
            <h2 className="font-display text-display-xs md:text-display-sm font-bold text-ink tracking-tight">
              Ready to see OrderMind on your packaging orders?
            </h2>
            <p className="text-body-base text-ink-muted max-w-xl mx-auto font-sans leading-relaxed">
              Experience the multi-modal inbox, Gemma claim extraction, and deterministic production brief sheet.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
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
        </section>
      </main>
    </div>
  );
}
