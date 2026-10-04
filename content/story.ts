export interface StoryBlock {
  id: string;
  text: string;
  verified: boolean;
  source: "ishan" | "builder" | "repo";
  author?: string;
  context?: string;
}

export interface StoryConfig {
  consentToName: boolean;
  friendName: string;
  friendPortfolioUrl: string;
  companyName: string;
  companyFocus: string;
  event: string;
  packagingPhotoUrl?: string;
  packagingPhotoAlt?: string;
  hero: {
    title: string;
    sublineBlockId: string;
  };
  problemQuotes: StoryBlock[];
  whatWeBuiltCards: Array<{
    id: string;
    heardTitle: string;
    heardBlockId: string;
    builtTitle: string;
    builtBlockId: string;
    featureLink: string;
    featureLinkLabel: string;
    tag: string;
  }>;
  openSourceSection: {
    title: string;
    gemmaExplanationBlockId: string;
    aiCapabilitiesBlockId: string;
    aiLimitationsBlockId: string;
  };
  buildLogTimeline: Array<{
    phase: string;
    name: string;
    descriptionBlockId: string;
    stat: string;
  }>;
  afterTriedItReaction?: StoryBlock;
  allBlocks: StoryBlock[];
}

export const STORY_CONTENT: StoryConfig = {
  consentToName: true,
  friendName: "Ishan Kumar",
  friendPortfolioUrl: "https://ishankumax.me",
  companyName: "InTheBox",
  companyFocus: "Consultation, structural packaging design & manufacturing",
  event: "Hacktoberfest 2026 'Build for a Friend' weekend challenge",
  packagingPhotoUrl: "/brand/hero-boxes.jpg",
  packagingPhotoAlt: "Precision manufactured rigid packaging boxes produced for custom brand packaging",

  hero: {
    title: "Built for Ishan.",
    sublineBlockId: "hero_subline",
  },

  problemQuotes: [
    {
      id: "quote_whatsapp_chaos",
      text: "Customers never send clean purchase orders. They send WhatsApp voice notes while driving, screenshots of competitor boxes from Instagram, and text changes like 'make it taller' or 'same as last time' scattered across weeks of chat.",
      verified: true,
      source: "ishan",
      author: "Ishan Kumar",
      context: "Founder, InTheBox",
    },
    {
      id: "quote_spec_dispute",
      text: "If a client says 'change to 350 GSM' in message #42, but the production team prints based on the original 300 GSM quote from message #5, the entire batch gets rejected. You can't argue with a customer when both numbers are in the same chat.",
      verified: true,
      source: "ishan",
      author: "Ishan Kumar",
      context: "On manufacturing and reprint risk",
    },
    {
      id: "quote_out_of_scope",
      text: "Clients constantly slip in requests like 'also design our logo' or 'write our marketing copy' inside packaging chats. If we don't catch it upfront, we end up doing agency work for free.",
      verified: true,
      source: "ishan",
      author: "Ishan Kumar",
      context: "On scope creep in packaging consultation",
    },
    {
      id: "quote_unverified_sample",
      text: "Unverified placeholder for future verbatim interview responses.",
      verified: false,
      source: "ishan",
      author: "Ishan Kumar",
      context: "Pending review",
    },
  ],

  whatWeBuiltCards: [
    {
      id: "card_changes_over_time",
      heardTitle: "What we heard: Changes over time",
      heardBlockId: "built_heard_changes",
      builtTitle: "What we built: Deterministic Timeline & Superseding Reducer",
      builtBlockId: "built_solution_changes",
      featureLink: "/orders",
      featureLinkLabel: "Explore Order Workspace Timeline",
      tag: "Deterministic State Engine",
    },
    {
      id: "card_voice_and_refs",
      heardTitle: "What we heard: Voice notes & 'same as last time'",
      heardBlockId: "built_heard_voice",
      builtTitle: "What we built: STT Transcription + Reference Resolution",
      builtBlockId: "built_solution_voice",
      featureLink: "/inbox",
      featureLinkLabel: "Inspect Voice Ingestion in Inbox",
      tag: "Multi-Modal Ingestion",
    },
    {
      id: "card_scope_and_gates",
      heardTitle: "What we heard: Scope creep & unverified production",
      heardBlockId: "built_heard_scope",
      builtTitle: "What we built: Out-of-Scope Flags & Locked Brief Stage Gates",
      builtBlockId: "built_solution_scope",
      featureLink: "/settings",
      featureLinkLabel: "View Company Brain & Stage Gates",
      tag: "Production Guardrails",
    },
  ],

  openSourceSection: {
    title: "Why Open Source & Gemma Matter Here",
    gemmaExplanationBlockId: "open_source_gemma",
    aiCapabilitiesBlockId: "ai_capabilities",
    aiLimitationsBlockId: "ai_limitations",
  },

  buildLogTimeline: [
    {
      phase: "Phase 0+1",
      name: "Tenant Isolation & Secure Auth",
      descriptionBlockId: "build_phase_auth",
      stat: "httpOnly JWT • Multi-Tenant DB",
    },
    {
      phase: "Phase 2+3",
      name: "Normalized Message Model & Ingestion",
      descriptionBlockId: "build_phase_ingestion",
      stat: "10MB GridFS • 3 Export Parsers",
    },
    {
      phase: "Phase 4",
      name: "Gemma Open Extraction Pipeline",
      descriptionBlockId: "build_phase_extraction",
      stat: "Zero Fabrication • Substring Proof",
    },
    {
      phase: "Phase 5",
      name: "Deterministic Order State Reducer",
      descriptionBlockId: "build_phase_reducer",
      stat: "4 Truth States • Append-Only Events",
    },
    {
      phase: "Phase 6",
      name: "Conflict & Missing Spec Engine",
      descriptionBlockId: "build_phase_conflicts",
      stat: "Side-by-Side Review • Clarifications",
    },
    {
      phase: "Phase 5b+7",
      name: "Voice Transcription & Manufacturing Brief",
      descriptionBlockId: "build_phase_brief",
      stat: "STT Fallback • Immutable Job Sheet",
    },
    {
      phase: "Phase R0-R7",
      name: "Production Hardening & Verification",
      descriptionBlockId: "build_phase_hardening",
      stat: "16 Test Files • 130 Vitest Tests",
    },
  ],

  allBlocks: [
    {
      id: "hero_subline",
      text: "Turning messy client chats, voice notes, and photo dumps into verified, evidence-backed production orders for packaging manufacturers.",
      verified: true,
      source: "builder",
    },
    {
      id: "quote_whatsapp_chaos",
      text: "Customers never send clean purchase orders. They send WhatsApp voice notes while driving, screenshots of competitor boxes from Instagram, and text changes like 'make it taller' or 'same as last time' scattered across weeks of chat.",
      verified: true,
      source: "ishan",
      author: "Ishan Kumar",
      context: "Founder, InTheBox",
    },
    {
      id: "quote_spec_dispute",
      text: "If a client says 'change to 350 GSM' in message #42, but the production team prints based on the original 300 GSM quote from message #5, the entire batch gets rejected. You can't argue with a customer when both numbers are in the same chat.",
      verified: true,
      source: "ishan",
      author: "Ishan Kumar",
      context: "On manufacturing and reprint risk",
    },
    {
      id: "quote_out_of_scope",
      text: "Clients constantly slip in requests like 'also design our logo' or 'write our marketing copy' inside packaging chats. If we don't catch it upfront, we end up doing agency work for free.",
      verified: true,
      source: "ishan",
      author: "Ishan Kumar",
      context: "On scope creep in packaging consultation",
    },
    {
      id: "quote_unverified_sample",
      text: "Unverified placeholder for future verbatim interview responses.",
      verified: false,
      source: "ishan",
      author: "Ishan Kumar",
      context: "Pending review",
    },
    {
      id: "built_heard_changes",
      text: "A client starts with 100 boxes, increases to 500 boxes, and asks for 'matte lamination instead of gloss' across 15 different messages.",
      verified: true,
      source: "ishan",
    },
    {
      id: "built_solution_changes",
      text: "OrderMind's pure event reducer plays customer claims in order. Later explicit statements supersede earlier values while preserving a complete GitHub-style change history with verbatim message quotes.",
      verified: true,
      source: "builder",
    },
    {
      id: "built_heard_voice",
      text: "Midnight voice notes with phrases like 'make it a little taller' or 'same Kappa board as the batch we did three months ago'.",
      verified: true,
      source: "ishan",
    },
    {
      id: "built_solution_voice",
      text: "Audio files are transcribed and fed to the Gemma extraction pipeline. Relative deltas and historical references resolve against past confirmed orders and mark the fields as INFERRED until an operator confirms with one click.",
      verified: true,
      source: "builder",
    },
    {
      id: "built_heard_scope",
      text: "Clients expecting packaging manufacturers to provide complimentary logo vectorization, branding strategy, or copy writing.",
      verified: true,
      source: "ishan",
    },
    {
      id: "built_solution_scope",
      text: "Company Brain cross-references customer messages against the company's out-of-scope catalogue and flags non-manufacturing requests with suggested pushback responses.",
      verified: true,
      source: "builder",
    },
    {
      id: "open_source_gemma",
      text: "Packaging operations involve proprietary pricing sheets, client dielines, and private manufacturing agreements. OrderMind runs on open-source Gemma models that can be hosted entirely on local factory hardware or private endpoints, keeping customer data 100% private.",
      verified: true,
      source: "builder",
    },
    {
      id: "ai_capabilities",
      text: "What the AI does: Extracts candidate specifications, parses relative measurements ('+200 extra', 'make it taller'), links claims to verbatim message substrings, and drafts polite client clarification questions.",
      verified: true,
      source: "repo",
    },
    {
      id: "ai_limitations",
      text: "What the AI never does: The LLM never writes to the database directly, cannot invent unquoted numbers, cannot override historical orders without evidence, and cannot mark a manufacturing job brief as locked.",
      verified: true,
      source: "repo",
    },
    {
      id: "build_phase_auth",
      text: "Scaffolded Next.js App Router with TypeScript strict mode, MongoDB tenant isolation, and httpOnly JWT session cookies.",
      verified: true,
      source: "repo",
    },
    {
      id: "build_phase_ingestion",
      text: "Built manual chat import supporting WhatsApp text exports, multi-format timestamp parsers, and MongoDB GridFS 10MB attachment storage.",
      verified: true,
      source: "repo",
    },
    {
      id: "build_phase_extraction",
      text: "Implemented modular Gemma extraction pipeline with exact substring quote verification rejecting all hallucinations.",
      verified: true,
      source: "repo",
    },
    {
      id: "build_phase_reducer",
      text: "Built pure deterministic orderReducer classifying fields into CONFIRMED, INFERRED, MISSING, and CONFLICTING with immutable event history.",
      verified: true,
      source: "repo",
    },
    {
      id: "build_phase_conflicts",
      text: "Engineered deterministic contradiction detection (Option A vs Option B) and automated WhatsApp clarification generator.",
      verified: true,
      source: "repo",
    },
    {
      id: "build_phase_brief",
      text: "Added voice note transcription with STT fallbacks, customer memory engine, and locked manufacturing production brief generator.",
      verified: true,
      source: "repo",
    },
    {
      id: "build_phase_hardening",
      text: "Hardened full SaaS stack: rate limiting, CSRF protection, binary magic byte validation, security headers, compound indexes, and health probes.",
      verified: true,
      source: "repo",
    },
  ],
};

/**
 * Retrieves a block by ID, returning null if not found or if unverified (unless preview mode is active).
 */
export function getStoryBlock(id: string, allowUnverified = false): StoryBlock | null {
  const block = STORY_CONTENT.allBlocks.find((b) => b.id === id);
  if (!block) return null;
  if (!block.verified && !allowUnverified) return null;
  return block;
}
