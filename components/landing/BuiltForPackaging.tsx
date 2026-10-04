"use client";

import * as React from "react";
import Image from "next/image";
import { Package, Check } from "lucide-react";

export function BuiltForPackaging() {
  const categories = [
    {
      title: "Rigid Luxury & Telescoping Boxes",
      subtitle: "Perfume, Jewelry & Electronics Packaging",
      badge: "Heavy Board",
      image: "/brand/hero-boxes.jpg",
      alt: "Rigid luxury packaging boxes with custom shoulder-neck and gold hot-stamping",
      specs: [
        { label: "Core Board", value: "1200 GSM Kappa / Greyboard" },
        { label: "Wrap Liner", value: "157 GSM C2S Art Paper Wrap" },
        { label: "Closure", value: "Hidden N52 Neodymium Magnets" },
        { label: "Insert Cavity", value: "Custom Water-Jet Cut EVA Foam" },
        { label: "Finishing", value: "Gold / Copper Foil Hot Stamping" },
      ],
    },
    {
      title: "Corrugated E-Commerce Mailers",
      subtitle: "D2C Brands, Shipping & Apparel Cartons",
      badge: "Flute Liners",
      image: "/brand/corrugated-mailers.jpg",
      alt: "Custom printed kraft corrugated mailer boxes with flexo printing and tear strip",
      specs: [
        { label: "Flute Profile", value: "E-Flute (1.5mm) / B-Flute (3mm)" },
        { label: "Liner Paper", value: "250 GSM Virgin Kraft / Testliner" },
        { label: "Crush Resistance", value: "ECT 32 / Burst 14 kg/cm²" },
        { label: "Sealing", value: "Double Adhesive Peel & Tear Strip" },
        { label: "Printing", value: "Direct Flexographic Water-Based Ink" },
      ],
    },
    {
      title: "Cosmetic & Pharma Folding Cartons",
      subtitle: "Skincare, Bottles & Retail Shelf Packaging",
      badge: "Solid Bleached Sulfate",
      image: "/brand/folding-cartons.jpg",
      alt: "Cosmetics folding monocartons in 350 GSM White SBS with soft-touch matte lamination",
      specs: [
        { label: "Board Grade", value: "350 GSM White SBS (FSC Certified)" },
        { label: "Structure", value: "Reverse Tuck End (RTE) with Lock" },
        { label: "Lamination", value: "Soft-Touch Velvet Matte Film" },
        { label: "Embellishment", value: "Registered Spot UV + Debossing" },
        { label: "Dieline Cut", value: "Steel Rule Laser Die (0.71mm Rule)" },
      ],
    },
  ];

  return (
    <section id="packaging-types" className="py-20 md:py-28 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-3 py-1 border border-border shadow-sm text-body-xs font-mono text-ink-muted mb-3">
            <span>Domain Specificity</span> • <span>Packaging Formats</span>
          </div>
          <h2 className="font-display text-heading-lg sm:text-display-md font-bold tracking-tight text-ink">
            Built for packaging. Speaks real converter vocabulary.
          </h2>
          <p className="mt-4 text-body-lg text-ink-muted leading-relaxed">
            Generic CRM or task tools don&rsquo;t understand paper caliper, flute orientation, GSM weights, or foil dies. OrderMind was engineered specifically for packaging printers, corrugators, and converters.
          </p>
        </div>

        {/* 3 Packaging Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="rounded-card-lg border border-border bg-surface-elevated overflow-hidden shadow-soft flex flex-col justify-between hover:shadow-tactile-hover hover:-translate-y-1 transition-all duration-200"
            >
              <div>
                {/* Real Product Photo Thumbnail */}
                <div className="relative w-full h-48 bg-surface-muted border-b border-border/80">
                  <Image
                    src={cat.image}
                    alt={cat.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 360px"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-surface/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-mono font-bold text-ink border border-border shadow-sm">
                      {cat.badge}
                    </span>
                  </div>
                </div>

                <div className="p-6 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display text-heading-md font-bold text-ink">
                      {cat.title}
                    </h3>
                  </div>
                  <p className="text-body-xs text-ink-muted font-sans">
                    {cat.subtitle}
                  </p>

                  <div className="mt-5 space-y-2">
                    {cat.specs.map((spec, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-between text-body-xs"
                      >
                        <span className="font-mono text-ink-muted text-[11px] uppercase">
                          {spec.label}
                        </span>
                        <span className="font-mono font-bold text-ink text-right text-xs">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-3 mt-2 border-t border-border flex items-center gap-1.5 text-[11px] font-mono text-ink-muted">
                <Check className="w-3.5 h-3.5 text-[#1F8A4C] stroke-[3]" />
                Auto-Normalizes Raw Chat to Technical Specs
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
