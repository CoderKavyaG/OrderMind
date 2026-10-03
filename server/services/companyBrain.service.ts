import { getDb } from "@/server/db/mongodb";
import {
  CompanyBrain,
  CompanyBrainSchema,
  BrainService,
  BrainPriceEntry,
} from "@/server/db/schema";
import { ObjectId } from "mongodb";

export const IN_THE_BOX_DEFAULT_SERVICES: BrainService[] = [
  {
    id: "consultation",
    category: "consultation",
    name: "Packaging Strategy Consultation",
    description: "Expert packaging advisory, structure feasibility, and material recommendation sessions.",
    pricingModel: "fixed",
    basePriceINR: 2000,
    deliverables: [
      "1-on-1 expert session",
      "Material and structural feasibility audit",
      "Supplier specification breakdown",
    ],
  },
  {
    id: "design",
    category: "design",
    name: "Custom Dieline & Packaging Design",
    description: "Production-ready dielines, visual artwork, finish mappings, and 3D mockups per SKU.",
    pricingModel: "fixed",
    basePriceINR: 8000,
    deliverables: [
      "Vector dielines (AI/PDF)",
      "Print-ready CMYK + Spot UV artwork",
      "3D digital mockup preview",
    ],
  },
  {
    id: "manufacturing",
    category: "manufacturing",
    name: "Turnkey Packaging Manufacturing",
    description: "High-precision automated plant production with rigid board, foiling, and quality inspection.",
    pricingModel: "quote_only",
    basePriceINR: null,
    deliverables: [
      "15-30 business day production run",
      "Pre-production proof / dieline signoff",
      "Batch quality control & moisture wrap",
    ],
  },
];

export const IN_THE_BOX_DEFAULT_PRICE_TABLE: BrainPriceEntry[] = [
  // Consultation Tiers
  {
    tierId: "starter-session",
    category: "consultation",
    name: "Starter Session",
    priceINR: 2000,
    billingUnit: "per 1hr session",
    notes: "1 hour introductory diagnostic on packaging structure and substrates.",
  },
  {
    tierId: "deep-dive-workshop",
    category: "consultation",
    name: "Deep Dive Workshop",
    priceINR: 6000,
    billingUnit: "per 3hr workshop",
    notes: "3 hour intensive deep dive on custom dielines, finishes, and unboxing experience.",
  },
  {
    tierId: "advisory-retainer",
    category: "consultation",
    name: "Monthly Advisory Retainer",
    priceINR: 12000,
    billingUnit: "per month (up to 4 sessions)",
    notes: "Ongoing retainer covering up to 4 sessions/month with priority turnaround.",
  },

  // Design Tiers (per SKU)
  {
    tierId: "design-standard",
    category: "design",
    name: "Standard Design",
    priceINR: 8000,
    billingUnit: "per SKU",
    notes: "2 concepts, 2 minor revisions, production AI/PDF vector files.",
  },
  {
    tierId: "design-advanced",
    category: "design",
    name: "Advanced Design",
    priceINR: 12000,
    billingUnit: "per SKU",
    notes: "3 concepts, unlimited minor revisions, 3D photorealistic renders.",
  },
  {
    tierId: "design-end-to-end",
    category: "design",
    name: "End-to-End Design Journey",
    priceINR: 25000,
    billingUnit: "per SKU",
    notes: "Full journey incl. bespoke dieline, file prep, physical sample checking; retainer included free.",
  },

  // Manufacturing Tier
  {
    tierId: "mfg-custom-run",
    category: "manufacturing",
    name: "Custom Manufacturing Run",
    priceINR: null,
    billingUnit: "NEEDS_QUOTE",
    notes: "Price varies by material, size, finish, accessories => status NEEDS_QUOTE, never auto-priced.",
  },
];

export const IN_THE_BOX_DEFAULT_MATERIALS = [
  "rigid board",
  "kraft",
  "premium card stock",
  "eco substrates",
];

export const IN_THE_BOX_DEFAULT_FINISHES = [
  "matte",
  "gloss",
  "soft-touch lamination",
  "spot UV",
  "embossing",
  "foiling",
  "window patch",
];

export const IN_THE_BOX_DEFAULT_ACCESSORIES = [
  "cards",
  "brochures",
  "ribbons",
  "inserts",
];

export const IN_THE_BOX_DEFAULT_POLICIES = [
  "Final design approval required before production (no changes allowed after signoff).",
  "Advance payment required before production commences.",
  "Physical production samples available on request with separate tooling charge.",
  "Standard manufacturing turnaround timeline: 15 to 30 business days from advance payment.",
];

export const IN_THE_BOX_DEFAULT_OUT_OF_SCOPE = [
  "logo/brand/tagline creation",
  "marketing or advertising advice",
  "ad copy",
  "vendor recommendations",
  "direct sourcing help",
  "manufacturing designs not created/approved by InTheBox",
];

export async function getCompanyBrain(workspaceId: string): Promise<CompanyBrain> {
  const db = await getDb();
  let brain = await db.collection<CompanyBrain>("company_brain").findOne({ workspaceId });

  if (!brain) {
    const newBrain: Omit<CompanyBrain, "_id" | "id"> = {
      workspaceId,
      version: 1,
      services: IN_THE_BOX_DEFAULT_SERVICES,
      priceTable: IN_THE_BOX_DEFAULT_PRICE_TABLE,
      materials: IN_THE_BOX_DEFAULT_MATERIALS,
      finishes: IN_THE_BOX_DEFAULT_FINISHES,
      accessories: IN_THE_BOX_DEFAULT_ACCESSORIES,
      policies: IN_THE_BOX_DEFAULT_POLICIES,
      outOfScope: IN_THE_BOX_DEFAULT_OUT_OF_SCOPE,
      updatedAt: new Date(),
    };

    const res = await db.collection("company_brain").insertOne(newBrain);
    brain = {
      ...newBrain,
      _id: res.insertedId,
      id: res.insertedId.toString(),
    };
  } else {
    brain = {
      ...brain,
      id: brain._id?.toString(),
    };
  }

  return CompanyBrainSchema.parse(brain);
}

export async function updateCompanyBrain(
  workspaceId: string,
  input: Partial<Omit<CompanyBrain, "_id" | "id" | "workspaceId" | "version">>
): Promise<CompanyBrain> {
  const db = await getDb();
  const current = await getCompanyBrain(workspaceId);

  const updatedBrain = {
    ...current,
    ...input,
    version: current.version + 1,
    updatedAt: new Date(),
  };

  const parsed = CompanyBrainSchema.parse(updatedBrain);

  await db.collection("company_brain").updateOne(
    { workspaceId },
    {
      $set: {
        version: parsed.version,
        services: parsed.services,
        priceTable: parsed.priceTable,
        materials: parsed.materials,
        finishes: parsed.finishes,
        accessories: parsed.accessories,
        policies: parsed.policies,
        outOfScope: parsed.outOfScope,
        updatedAt: parsed.updatedAt,
      },
    },
    { upsert: true }
  );

  return parsed;
}

export async function resetCompanyBrain(workspaceId: string): Promise<CompanyBrain> {
  const db = await getDb();
  const current = await getCompanyBrain(workspaceId);

  const resetData = {
    services: IN_THE_BOX_DEFAULT_SERVICES,
    priceTable: IN_THE_BOX_DEFAULT_PRICE_TABLE,
    materials: IN_THE_BOX_DEFAULT_MATERIALS,
    finishes: IN_THE_BOX_DEFAULT_FINISHES,
    accessories: IN_THE_BOX_DEFAULT_ACCESSORIES,
    policies: IN_THE_BOX_DEFAULT_POLICIES,
    outOfScope: IN_THE_BOX_DEFAULT_OUT_OF_SCOPE,
    version: current.version + 1,
    updatedAt: new Date(),
  };

  await db.collection("company_brain").updateOne(
    { workspaceId },
    { $set: resetData }
  );

  return getCompanyBrain(workspaceId);
}
