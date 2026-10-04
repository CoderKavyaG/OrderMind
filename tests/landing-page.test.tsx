import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingHeader } from "@/components/landing/Header";
import { LandingHero } from "@/components/landing/HeroSection";
import { ScatteredThreadSection } from "@/components/landing/ScatteredThreadSection";
import { FourStatesSection } from "@/components/landing/FourStatesSection";
import { InteractiveEvidenceSection } from "@/components/landing/InteractiveEvidenceSection";
import { TimelineSection } from "@/components/landing/TimelineSection";
import { ConflictSection } from "@/components/landing/ConflictSection";
import { VoiceNotesSection } from "@/components/landing/VoiceNotesSection";
import { ProductionBriefSection } from "@/components/landing/ProductionBriefSection";
import { OpenSourceSection } from "@/components/landing/OpenSourceSection";
import { SketchbookPipeline } from "@/components/landing/SketchbookPipeline";
import { BuiltForPackaging } from "@/components/landing/BuiltForPackaging";
import { FaqAndFooter } from "@/components/landing/FaqAndFooter";

describe("Phase R6: Landing Page Section Smoke & Copy Compliance Tests", () => {
  it("renders LandingHeader with pill navigation, logo, and Get started CTA", () => {
    const html = renderToStaticMarkup(<LandingHeader />);
    expect(html).toContain("OrderMind");
    expect(html).toContain("How it works");
    expect(html).toContain("Features");
    expect(html).toContain("Open-source");
    expect(html).toContain("Our story");
    expect(html).toContain("Sign in");
    expect(html).toContain("Get started");
    expect(html).not.toContain("Launch demo workspace");
  });

  it("renders LandingHero with required headline, subhead, 3D centerpiece, and Get started CTA", () => {
    const html = renderToStaticMarkup(<LandingHero />);
    expect(html).toContain("Turn messy customer chats into production-ready orders.");
    expect(html).toContain("WhatsApp texts, voice notes and photos in; one verified, evidence-backed order and production brief out.");
    expect(html).toContain("Watch the 90-second walkthrough");
    expect(html).toContain("Get started");
    expect(html).not.toContain("Launch demo workspace");
    // Verify orbiting tactile tile labels
    expect(html).toContain("500 units");
    expect(html).toContain("200x140x90 mm");
    expect(html).toContain("Gold Foil");
    expect(html).toContain("make taller");
    expect(html).toContain("Dieline.pdf");
  });

  it("renders ScatteredThreadSection with WhatsApp chat and structured order", () => {
    const html = renderToStaticMarkup(<ScatteredThreadSection />);
    expect(html).toContain("The order is scattered. OrderMind compiles it.");
    expect(html).toContain("Aarav Prints");
    expect(html).toContain("Structured Order #ORD-2026-881");
    expect(html).toContain("Rigid Box w/ Magnetic Flap");
  });

  it("renders FourStatesSection with CONFIRMED, INFERRED, MISSING, CONFLICTING cards", () => {
    const html = renderToStaticMarkup(<FourStatesSection />);
    expect(html).toContain("Four states of truth. Zero guessing.");
    expect(html).toContain("CONFIRMED");
    expect(html).toContain("INFERRED");
    expect(html).toContain("MISSING");
    expect(html).toContain("CONFLICTING");
    expect(html).toContain("Quantity: 500 boxes");
    expect(html).toContain("Board Material: 350 GSM vs 300 GSM");
  });

  it("renders InteractiveEvidenceSection with quote inspector and confirm action", () => {
    const html = renderToStaticMarkup(<InteractiveEvidenceSection />);
    expect(html).toContain("Touch a field. See the verbatim proof.");
    expect(html).toContain("Verbatim Quote Inspector");
    expect(html).toContain("Order Quantity");
    expect(html).toContain("Board Material");
  });

  it("renders TimelineSection showing quantity 100 to 500 and height adjustments", () => {
    const html = renderToStaticMarkup(<TimelineSection />);
    expect(html).toContain("Every change recorded like Git for packaging.");
    expect(html).toContain("100");
    expect(html).toContain("500");
  });

  it("renders ConflictSection with 300 GSM vs 350 GSM resolution dialog", () => {
    const html = renderToStaticMarkup(<ConflictSection />);
    expect(html).toContain("When the customer contradicts themselves, AI flags it. You decide.");
    expect(html).toContain("350 GSM White SBS board");
    expect(html).toContain("300 GSM Art Board Matte");
    expect(html).toContain("Confirm 350 GSM White SBS board");
  });

  it("renders VoiceNotesSection with audio player and claim chips", () => {
    const html = renderToStaticMarkup(<VoiceNotesSection />);
    expect(html).toContain("Spoken voice notes in. Structured specifications out.");
    expect(html).toContain("Audio Memo Stream");
    expect(html).toContain("bump the quantity up to 500 units");
  });

  it("renders ProductionBriefSection with locked/unlocked state and print CTA", () => {
    const html = renderToStaticMarkup(<ProductionBriefSection />);
    expect(html).toContain("A production brief that unlocks only when 100% confirmed.");
    expect(html).toContain("Factory Job Brief #ORD-2026-881");
    expect(html).toContain("Sealed For Press &amp; Die-Cutting");
  });

  it("renders OpenSourceSection with local Gemma and honest AI boundaries", () => {
    const html = renderToStaticMarkup(<OpenSourceSection />);
    expect(html).toContain("Open-source by design. Your data stays in your factory.");
    expect(html).toContain("Gemma Local Extraction");
    expect(html).toContain("An Honest Note on What the AI Can");
  });

  it("renders SketchbookPipeline with 6 stages", () => {
    const html = renderToStaticMarkup(<SketchbookPipeline />);
    expect(html).toContain("How OrderMind transforms the factory workflow.");
    expect(html).toContain("Chat Ingest");
    expect(html).toContain("Gemma Extract");
    expect(html).toContain("Event Reducer");
    expect(html).toContain("Conflict Detect");
    expect(html).toContain("Human Confirm");
    expect(html).toContain("Factory Brief");
  });

  it("renders BuiltForPackaging with technical vocabulary and real photos", () => {
    const html = renderToStaticMarkup(<BuiltForPackaging />);
    expect(html).toContain("Built for packaging. Speaks real converter vocabulary.");
    expect(html).toContain("Rigid Luxury &amp; Telescoping Boxes");
    expect(html).toContain("Corrugated E-Commerce Mailers");
    expect(html).toContain("Cosmetic &amp; Pharma Folding Cartons");
    expect(html).toContain("hero-boxes.jpg");
    expect(html).toContain("corrugated-mailers.jpg");
    expect(html).toContain("folding-cartons.jpg");
  });

  it("renders FaqAndFooter with converter questions, final CTA, and footer links", () => {
    const html = renderToStaticMarkup(<FaqAndFooter />);
    expect(html).toContain("Frequently Asked Questions");
    expect(html).toContain("Does OrderMind replace our factory ERP or MIS?");
    expect(html).toContain("Stop letting packaging orders slip through chat threads.");
    expect(html).toContain("Get started");
    expect(html).not.toContain("Launch demo workspace");
  });

  it("strictly adheres to copy rules: uses 'evidence-backed' and 'human-confirmed'", () => {
    const fullHtml = renderToStaticMarkup(
      <div>
        <LandingHeader />
        <LandingHero />
        <ScatteredThreadSection />
        <FourStatesSection />
        <InteractiveEvidenceSection />
        <TimelineSection />
        <ConflictSection />
        <VoiceNotesSection />
        <ProductionBriefSection />
        <OpenSourceSection />
        <SketchbookPipeline />
        <BuiltForPackaging />
        <FaqAndFooter />
      </div>
    );

    // Required affirmative copy
    expect(fullHtml.toLowerCase()).toContain("evidence-backed");
    expect(fullHtml.toLowerCase()).toContain("human-confirmed");
  });
});
