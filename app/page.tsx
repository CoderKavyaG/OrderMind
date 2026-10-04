import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "OrderMind — Precision Packaging Orders from Messy Customer Chats",
  description:
    "WhatsApp texts, voice notes and photos in; one verified, evidence-backed order and production brief out for packaging converters.",
  openGraph: {
    title: "OrderMind — Precision Packaging Intelligence",
    description:
      "Turn messy customer conversations into verified, evidence-backed structured orders and production briefs.",
    url: "https://ordermind.pack",
    siteName: "OrderMind",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OrderMind Packaging Intelligence",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrderMind — Precision Packaging Orders",
    description:
      "Turn messy customer conversations into verified, evidence-backed structured orders and production briefs.",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas bg-dotted-grid text-ink selection:bg-brand-lime selection:text-ink antialiased">
      {/* 1. Floating Pill Header */}
      <LandingHeader />

      {/* 2. Hero Section with 3D Packaging Centerpiece and Orbiting TactileTiles */}
      <LandingHero />

      {/* 3. 'The Order is Scattered' — WhatsApp Thread into Structured Order Card */}
      <ScatteredThreadSection />

      {/* 4. 'Four States of Truth' — CONFIRMED, INFERRED, MISSING, CONFLICTING */}
      <FourStatesSection />

      {/* 5. Interactive Evidence Demo — Hover to Highlight Quotes & Confirm Inferred Field */}
      <InteractiveEvidenceSection />

      {/* 6. Branching Change Timeline & Bottom Scrubber Dock */}
      <TimelineSection />

      {/* 7. Interactive Conflict Moment — 300 GSM Matte vs 350 GSM Gloss Resolution */}
      <ConflictSection />

      {/* 8. Voice Notes & Transcription Audio Scrubber with Lighting Claim Chips */}
      <VoiceNotesSection />

      {/* 9. Sealed Factory Production Brief — Unlocks only when all fields are confirmed */}
      <ProductionBriefSection />

      {/* 10. Open-Source by Design — Local Gemma Execution & Data Sovereignty */}
      <OpenSourceSection />

      {/* 11. Sketchbook Pipeline — Hand-Drawn SVG Architecture Cards */}
      <SketchbookPipeline />

      {/* 12. Built Specifically for Packaging — Rigid Boxes, Mailers, Folding Cartons */}
      <BuiltForPackaging />

      {/* 13. Converter FAQ, Final Call to Action, and Tactile Footer */}
      <FaqAndFooter />
    </div>
  );
}
