"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Box,
  Layers,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [businessName, setBusinessName] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("Packaging, Boxes & Print Manufacturing");
  const [customIndustry, setCustomIndustry] = useState("");

  const INDUSTRY_PRESETS = [
    {
      title: "Packaging, Boxes & Print Manufacturing",
      desc: "Rigid boxes, monocartons, corrugated mailers, labels, gold foil & spot UV",
      icon: Package,
      attributes: [
        "SBS Board (300-400 GSM)",
        "Kappa Greyboard (1.5-3mm)",
        "Kraft / E-Flute Corrugated",
        "Hot Foil Stamping (Gold/Silver)",
        "Soft-Touch Matte & Spot UV",
        "Embossing / Debossing",
      ],
    },
    {
      title: "Apparel, Fashion & Garment Manufacturing",
      desc: "Custom apparel, cotton GSM, embroidery, screen printing, custom woven tags",
      icon: Layers,
      attributes: [
        "Combed Cotton (180-240 GSM)",
        "French Terry & Fleece (320 GSM)",
        "Screen Printing & DTG",
        "High-Density Embroidery",
        "Custom Woven Neck Labels",
        "Polybag & Hangtag Packing",
      ],
    },
    {
      title: "Food, Beverage & Catering Supply",
      desc: "Food-grade pouches, barrier liners, custom tin cans, batch expiry dates",
      icon: Box,
      attributes: [
        "Food-Grade Barrier Foil",
        "Stand-Up Zipper Pouches",
        "Tamper-Evident Security Seal",
        "Eco-Friendly Glass / Tin",
        "Custom Nutritional Labeling",
        "Temperature-Controlled Packing",
      ],
    },
    {
      title: "Consumer Electronics & Hardware",
      desc: "CNC enclosures, injection molded ABS, PCB assemblies, laser engraving",
      icon: Zap,
      attributes: [
        "Anodized Aluminum CNC",
        "Injection Molded ABS / Polycarb",
        "Laser Serial Number Engraving",
        "IP67 Waterproof Gaskets",
        "Anti-Static ESD Packaging",
        "Custom Foam Inlays",
      ],
    },
    {
      title: "Corporate Gifting & Custom Merchandise",
      desc: "Branded gift hampers, laser engraved wood/metal, diaries, mugs, swag kits",
      icon: Sparkles,
      attributes: [
        "Laser Engraved Metal / Wood",
        "Hardbound Leatherette Journals",
        "UV Color Printing",
        "Custom Velvet / EVA Inserts",
        "Ribbon & Wax Seal Accents",
        "Kitted Assembly & Shipping",
      ],
    },
    {
      title: "Custom Orders & General B2B Services",
      desc: "Any custom manufacturing, client inquiries, specifications & order tracking",
      icon: Building2,
      attributes: [
        "Dimensions & Blueprints",
        "Quantity Tier Pricing",
        "Material Substrate Selection",
        "Custom Surface Finishing",
        "Milestone Delivery Deadlines",
        "Payment & PO Verification",
      ],
    },
  ];

  const currentPreset = INDUSTRY_PRESETS.find((p) => p.title === selectedNiche) || INDUSTRY_PRESETS[0];

  const [selectedSubstrates, setSelectedSubstrates] = useState<string[]>([
    "SBS Board (300-400 GSM)",
    "Kappa Greyboard (1.5-3mm)",
    "Hot Foil Stamping (Gold/Silver)",
    "Soft-Touch Matte & Spot UV",
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const toggleSubstrate = (sub: string) => {
    setSelectedSubstrates((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSelectNiche = (nicheTitle: string) => {
    setSelectedNiche(nicheTitle);
    const preset = INDUSTRY_PRESETS.find((p) => p.title === nicheTitle);
    if (preset) {
      setSelectedSubstrates(preset.attributes.slice(0, 4));
    }
  };


  const handleFinalSubmit = async () => {
    if (!businessName.trim()) {
      setError("Please specify your company or plant name.");
      setStep(1);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          industry: selectedNiche,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to set up workspace");
      }

      router.push("/workspace");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong setting up workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans selection:bg-brand-lime selection:text-ink">
      {/* Header with Step Progress */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lime text-ink shadow-tactile font-display font-extrabold text-base border border-[#BDE82B] transition-transform group-hover:scale-105">
            OM
          </div>
          <span className="font-display text-xl font-bold text-ink tracking-tight">OrderMind</span>
        </Link>

        <h1 className="font-display text-display-xs sm:text-display-sm font-bold text-ink tracking-tight">
          Initialize Converter Workspace
        </h1>
        <p className="mt-1 text-body-xs text-ink-muted font-sans">
          Configure production rules, substrate catalog, and multi-tenant isolation.
        </p>

        {/* 3-Step Pill Progress Bar */}
        <div className="mt-6 flex items-center justify-center gap-2 sm:gap-3">
          {/* Step 1 Pill */}
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-body-xs font-semibold transition border ${
              step === 1
                ? "bg-brand-lime text-slate-950 shadow-tactile border-[#BDE82B]"
                : step > 1
                ? "bg-surface text-ink border-border shadow-xs"
                : "bg-surface-muted text-ink-subtle border-transparent"
            }`}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-black/10">
              1
            </span>
            <span>Profile</span>
          </button>

          <div className="w-6 h-[1px] bg-border" />

          {/* Step 2 Pill */}
          <button
            onClick={() => businessName.trim() && setStep(2)}
            disabled={!businessName.trim()}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-body-xs font-semibold transition border ${
              step === 2
                ? "bg-brand-lime text-slate-950 shadow-tactile border-[#BDE82B]"
                : step > 2
                ? "bg-surface text-ink border-border shadow-xs"
                : "bg-surface-muted text-ink-subtle border-transparent"
            }`}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-black/10">
              2
            </span>
            <span>Substrates</span>
          </button>

          <div className="w-6 h-[1px] bg-border" />

          {/* Step 3 Pill */}
          <button
            onClick={() => businessName.trim() && setStep(3)}
            disabled={!businessName.trim()}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-body-xs font-semibold transition border ${
              step === 3
                ? "bg-brand-lime text-slate-950 shadow-tactile border-[#BDE82B]"
                : "bg-surface-muted text-ink-subtle border-transparent"
            }`}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-black/10">
              3
            </span>
            <span>Launch</span>
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="rounded-card-lg bg-surface border border-border p-6 sm:p-8 shadow-floating">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-body-xs font-medium text-rose-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Converter Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-body-xs font-semibold text-ink mb-2 font-sans">
                  Company / Factory Name <span className="text-brand-limeDark font-bold">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-subtle">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    placeholder="e.g. InTheBox Production Studio"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-muted border border-border text-ink placeholder:text-ink-subtle text-body-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition font-sans"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-muted font-sans">
                  This establishes your isolated tenant schema. Every customer, message, and order will be bound to this workspace.
                </p>
              </div>

              <div>
                <label className="block text-body-xs font-semibold text-ink mb-2.5 font-sans">
                  Select Business Industry &amp; Niche
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INDUSTRY_PRESETS.map((niche) => {
                    const Icon = niche.icon;
                    const isSelected = selectedNiche === niche.title;
                    return (
                      <button
                        key={niche.title}
                        type="button"
                        onClick={() => handleSelectNiche(niche.title)}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-brand-lime/15 border-brand-lime shadow-xs"
                            : "bg-surface-muted/50 border-border hover:border-ink/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-ink font-bold" : "text-ink-muted"}`} />
                          <span className={`text-body-xs font-bold ${isSelected ? "text-ink" : "text-ink"}`}>
                            {niche.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted leading-snug">{niche.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (!businessName.trim()) {
                      setError("Please provide a company or business name to continue.");
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                  className="w-full h-11 rounded-full bg-brand-lime text-slate-950 font-bold hover:bg-brand-limeHover border border-[#BDE82B] shadow-tactile text-body-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Specifications &amp; Rules</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Substrates / Specifications */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-body-sm font-bold text-ink mb-1 font-display">Configure Tracked Specifications</h3>
                <p className="text-body-xs text-ink-muted font-sans">
                  Trained for <strong>{selectedNiche}</strong>. Select the attributes, materials, and options recognized from customer chats.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentPreset.attributes.map((substrate) => {
                  const isChecked = selectedSubstrates.includes(substrate);
                  return (
                    <button
                      key={substrate}
                      type="button"
                      onClick={() => toggleSubstrate(substrate)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between text-body-xs transition cursor-pointer ${
                        isChecked
                          ? "bg-brand-lime/15 border-brand-lime text-ink font-semibold"
                          : "bg-surface-muted/50 border-border text-ink-muted hover:border-ink/30"
                      }`}
                    >
                      <span>{substrate}</span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isChecked
                            ? "bg-brand-lime border-brand-limeHover text-ink"
                            : "border-border bg-surface"
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3 h-3 text-ink fill-current" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-full h-11 px-5 border-border text-ink font-semibold text-body-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 h-11 rounded-full bg-brand-lime text-slate-950 font-bold hover:bg-brand-limeHover border border-[#BDE82B] shadow-tactile text-body-sm flex items-center justify-center gap-2"
                >
                  <span>Review & Complete</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-body-sm font-bold text-ink mb-1 font-display">Verify Workspace Configuration</h3>
                <p className="text-body-xs text-ink-muted font-sans">
                  Review your settings before initializing the deterministic state engine.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-surface-muted border border-border space-y-3 text-body-xs font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-ink-muted">Converter Workspace:</span>
                  <span className="text-ink font-bold">{businessName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-ink-muted">Niche Category:</span>
                  <span className="text-ink font-semibold">{selectedNiche}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-ink-muted">Selected Substrates:</span>
                  <span className="text-ink">{selectedSubstrates.length} capabilities ready</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-muted">Deterministic Engine:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-lime/20 text-ink border border-brand-lime/40">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-muted/60 border border-border flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-brand-limeDark mt-0.5 shrink-0" />
                <p className="text-[11px] text-ink-muted leading-relaxed font-sans">
                  Your workspace will immediately be assigned full <strong>OWNER</strong> privileges with encrypted JWT authentication stored in httpOnly secure cookies.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-full h-11 px-5 border-border text-ink font-semibold text-body-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex-1 h-11 rounded-full bg-brand-lime text-slate-950 font-bold hover:bg-brand-limeHover border border-[#BDE82B] shadow-tactile text-body-sm flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{loading ? "Initializing Hub..." : "Complete Setup & Launch Workspace"}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
