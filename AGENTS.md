# AGENTS.md — rules for every task in this repo

PROJECT: OrderMind turns messy customer conversations (text, voice, images) into a reliable, evidence-backed structured order for a packaging business.

## HARD RULES:
1. Inspect the repository first. Understand existing architecture. Preserve working code. Implement ONLY the current phase. No unrelated refactors.
2. The LLM never mutates order state. LLM output = validated "ExtractedEvent" claims (Zod). A deterministic reducer computes order fields and statuses.
3. Field statuses: CONFIRMED | INFERRED | MISSING | CONFLICTING. Every field keeps evidence (messageId + quote).
4. Everything is normalized into one internal message format regardless of source. No channel-specific business logic; use the ChannelAdapter interface.
5. Stack: Next.js (App Router, TypeScript strict), MongoDB Atlas via official driver, Zod, Tailwind. LLM access only through the LLMProvider interface (Ollama + hosted Gemma implementations).
6. Secrets only via environment variables; maintain .env.example; never hardcode keys; never log secrets.
7. Validate all inputs with Zod. Handle errors with typed, user-safe messages. Every query is scoped by workspaceId.
8. Auth tokens only in httpOnly, secure, sameSite cookies. Never localStorage.
9. Write or update tests for new logic (Vitest). Run lint, typecheck, build, and tests; fix every failure before stopping. Verify the dev server starts.
10. Zero-budget: no paid services. No new dependency without a one-line justification.

FINAL REPORT (always): files changed, commands run with results, anything incomplete or risky.

---

## STANDING RULES:
- First inspect the repo and read existing architecture/README before changing anything. Preserve working code.
- Implement ONLY the current phase. No unrelated refactors. No features from later phases.
- Clean architecture: UI in `app/` and `components/`, business logic in `server/services`, AI in `server/ai`, DB in `server/db`. No DB or LLM calls inside React components.
- Secrets only via environment variables; maintain `.env.example`; never hardcode keys.
- Validate all inputs with Zod. Handle and surface errors with clear messages; no silent catches.
- Write/update tests for new logic. Run lint, typecheck, build and tests; fix every failure before stopping.
- Start the app and verify the feature works end to end.
- UI: Linear/Notion-style, dense but calm, shadcn/ui + Tailwind, responsive (usable at 390px), loading/empty/error states for every screen.
- Finish with: files changed, commands run, test results, and any remaining issues stated explicitly.

---

## CURRENT GOAL:
A deployed-quality skeleton where a user can sign up, create a workspace, and land in an empty dashboard. 
- **Build:** project scaffold, Mongo connection, `/signup`, `/login`, `/logout`, `/me`, httpOnly JWT cookie, middleware-protected routes, onboarding (business name + industry), app shell with sidebar: Inbox, Orders, Customers, Channels, Memory, Settings. Collections: `users`, `workspaces`, `members` (`OWNER`/`ADMIN`/`OPERATOR`). Every query scoped by `workspaceId`.
- **Don't build:** OAuth, invites, billing, email verification.
- **Done when:** signup → onboarding → dashboard works; unauthenticated access redirects; no token in localStorage; auth tests pass.

---

## PHASE 0+1: OrderMind Foundation & Multi-Tenant Auth
Multi-tenant SaaS that turns messy customer chats into structured production orders.

1. **Scaffold Next.js (App Router, TS)**, Tailwind, shadcn/ui, Zod, Vitest, ESLint. Folders: `app/`, `components/`, `server/{db,services,ai,auth}`, `lib/`.
2. **MongoDB Atlas connection** (`MONGODB_URI` env) with a cached client. Collections: `users`, `workspaces`, `members` (role `OWNER`|`ADMIN`|`OPERATOR`).
3. **Auth:** `POST /api/auth/signup`, `/login`, `/logout`, `GET /api/auth/me`. `bcryptjs` hashing, JWT via `jose` in an httpOnly, SameSite=Lax, Secure-in-prod cookie. No tokens in localStorage. Rate-limit login simply in memory.
4. **Middleware** protects everything except `/login` and `/signup`. Helper `requireWorkspace()` that returns `{user, workspace, role}` and is used by every API route; all queries must filter by `workspaceId`.
5. **Onboarding page** after signup: business name + industry (default "Packaging"). Creates workspace + `OWNER` member.
6. **App shell:** sidebar (Inbox, Orders, Customers, Channels, Memory, Settings), topbar with workspace name and user menu. Pages are polished empty states.
7. **Tests:** password hashing, signup/login validation, `requireWorkspace` tenant isolation (user A cannot read workspace B).

> **Do NOT build OAuth, invites, billing or any AI.**

---

## PHASE 2+3: Manual Ingestion & Normalized Message Model
Build manual ingestion and the normalized message model.
1. Define Zod + TS types: NormalizedMessage {source:'manual'|'whatsapp'|'instagram', conversationId, senderId, senderRole:'customer'|'business', timestamp, type:'text'|'image'|'voice'|'pdf', content, attachments[]}. Define interface ChannelAdapter { normalize(raw): NormalizedMessage[] } and implement ManualImportAdapter only. Add stub WhatsAppAdapter/InstagramAdapter files that throw "not implemented" and are documented.
2. Collections: channels, customers, conversations, messages, attachments. Store uploaded files in MongoDB GridFS; cap size 10MB; validate mime types.
3. Import UI (Inbox > "Import conversation"): pick or create a customer, paste/upload a WhatsApp export .txt (parse "[date, time] Name: message" and the common alternate formats, including "<attached: file>" lines), and drag-drop images, audio and PDFs that attach to a chosen message position. Show a preview before saving.
4. Inbox: left list of conversations (customer, last message, time), right thread view with chat bubbles, inline image preview, audio player, PDF chip.
5. Seed script `npm run seed:demo` creating a packaging workspace with customer "Aarav Prints", a 12-message conversation (quantity change 100→500, "make it a little taller", "same as last time", gold logo, a deadline, an image, a voice note placeholder), plus one older completed conversation for history. Store the demo text in /fixtures.
6. Tests: parser for 3 export formats, adapter normalization, tenant scoping.
No AI yet.

---

## PHASE 4: Gemma Extraction Pipeline (Open-Source AI Core)
Turn each message into typed, evidence-backed events through modular extraction stages.
1. `server/ai/LLMProvider` interface: `generateJSON({system, prompt, schema, images?}) -> parsed object`. Implement `GemmaProvider` configured by env (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` optional) supporting local Ollama or hosted Gemma endpoints. Add `MockProvider` for tests. If configured model does not support vision, fall back to text-only with an "image not analyzed" flag.
2. Stages in `server/ai/stages/`:
   - `extractFields.ts`: per message, with preceding 6 messages as context window.
   - `interpretReferences.ts`: relative phrases ("taller", "+200 extra", "same as last time" -> `op: 'delta' | 'ref'`, keeping raw phrase).
   - `extractFromImage.ts`: reference designs -> visible specs + description (or fallback flag).
3. Schema `ExtractedEvent`: `{field, value, unit?, op: 'set'|'delta'|'ref', messageId, quote, confidence}`. Reject outputs where quote is not found in message text. Zod-validate, retry once on invalid JSON, then mark `extraction_failed`. Never fabricate fields.
4. Persist events in collection `extracted_events`. Add `POST /api/conversations/:id/process` (idempotent; skips already-processed messages) and a "Process conversation" button with a progress state.
5. Debug view in the thread: show extracted events beside each message.
6. Tests with MockProvider + golden fixtures: quantity set/delta, "same as last time" -> ref, invalid JSON retry, hallucinated quote rejected.
Do NOT build order state, conflict logic or UI beyond the debug view.

---

## PHASE 5: Order State Engine
An order is a history of events, not a JSON blob.
1. Collections:
   - `orders`: `{workspaceId, customerId, conversationId, orderNumber, status:'DRAFT'|'NEEDS_REVIEW'|'CONFIRMED', currentFields, createdAt, updatedAt}`
   - `order_events`: `{orderId, workspaceId, timestamp, field, previousValue, newValue, status, source:{messageId,quote}, actor:'ai'|'human', confirmation:'pending'|'confirmed'|'rejected', createdAt}`
   - `order_versions`: snapshot on each confirmation
2. `server/services/orderReducer.ts`: pure function replaying events into fields `{value, status:'CONFIRMED'|'INFERRED'|'MISSING'|'CONFLICTING', evidence[]}`. Rules:
   - `op='set'` with explicit value -> CONFIRMED (customer-stated candidate)
   - `op='delta'|'ref'` -> INFERRED (requires human confirmation)
   - required packaging fields (`productType`, `quantity`, `dimensions`, `material`, `finish`, `printing`, `deadline`) absent -> MISSING
   - later events supersede earlier ones but keep complete history
   - LLM output enters ONLY via validated events
3. Convert `extracted_events` into `order_events` when conversation is processed (create order if none).
4. Order Workspace page `/orders/[id]`: header (customer, status), spec table with colored status chips (green/amber/gray-dashed/red), evidence popover per field (quote + jump to message link), change timeline in GitHub-diff style (field, old -> new, when, source), actions Confirm / Edit on each field.
5. Orders list page with status filters.
6. Tests: reducer unit tests (supersede, delta on prior value, missing detection, human confirm flips status), event immutability, tenant scoping.
Do NOT build conflict detection, clarifications or production brief.

---

## PHASE 6: Change, Conflict, and Missing-Information Detection + Human Confirmation
This is the demo's wow phase.
1. `server/services/changeDetector.ts`: from `order_events` produce `Change {field, from, to, when, evidence}`. Show a "What changed" panel with plain-English explanations.
2. `server/services/conflictDetector.ts`: deterministic rules:
   - (a) same field, two contradictory explicit customer values at different times without a clear "actually/change to" cue.
   - (b) a 'ref' event ("same as last time") whose resolved historical value differs from the current draft value (e.g. 350 GSM gloss draft vs historical 300 GSM matte).
   - Mark field `CONFLICTING` with both evidences. Use Gemma only to write the human explanation, never to decide.
3. `server/services/missingDetector.ts` -> collection `clarifications {orderId, workspaceId, field, question, status:'open'|'answered'|'dismissed', createdAt}`. Gemma drafts a short, polite question; fall back to template if LLM fails. UI: "Pending clarifications" card with Copy question (NO sending).
4. "Answer received" flow: paste customer reply as a new message, reprocess, auto-close the clarification if the field is now set.
5. Resolve-conflict dialog: two options side by side with quotes; choosing one writes a human event and sets `CONFIRMED`. Inferred fields have one-click Confirm.
6. Order status moves `NEEDS_REVIEW` -> `CONFIRMED` only when no `MISSING`/`CONFLICTING`/`INFERRED` required fields remain; writes an `order_version`.
7. Tests: exact demo scenario (300 GSM matte past order vs 350 gloss draft with "same material as last time") produces `CONFLICTING`; missing deadline -> clarification; resolution unblocks `CONFIRMED`; end-to-end process -> resolve -> confirm.
Do NOT add Temporal, outbound messaging or production brief.

---

## PHASE 5b: Voice Transcription & Customer Memory / History
1. `server/ai/transcribe.ts` with a `Transcriber` interface; `ElevenLabsTranscriber` using `ELEVENLABS_API_KEY`; `ManualTranscriber` fallback (user pastes text or mock fallback). On upload of a voice message, transcribe, store transcript on the message, mark type 'voice', then run it through the normal extraction pipeline. Show transcript under the audio player.
2. Collection `customer_memory` `{workspaceId, customerId, fact, kind:'preference'|'shorthand'|'pattern', source:{orderId|messageId}, verified:boolean}`. Memory page (`/memory`): list/edit/verify/delete per customer, plus suggested memories drafted after an order is CONFIRMED (user accepts or rejects; never auto-saved as verified).
3. `server/services/historyRetrieval.ts`: structured Mongo queries returning the customer's most recent confirmed `order_versions`. Resolve 'ref' events ("same as last time", "like the gold one") against it. Matching past order appears in the Order Workspace as "Previous matching orders" with a compare view.
4. Rule: memory/history can only create INFERRED values and can never override an explicit current customer statement.
5. Tests: transcription failure fallback, ref resolution picks the latest confirmed version, memory cannot override explicit values.
No vector search, no Backboard.

---

## PHASE 7: Production Brief
1. Collection `production_briefs {orderId, versionId, generatedAt, content}`. Generation is blocked unless the order is CONFIRMED. Build the brief deterministically from the confirmed order_version (no LLM-invented fields); optionally let Gemma write only the "special instructions" summary from confirmed text.
2. Brief layout: Customer, Product, Quantity, Dimensions, Material, Printing, Finish, Accessories, Deadline, Reference files (thumbnails), Special instructions, plus a footer "Generated from confirmed version N".
3. UI: "Generate production brief" button, clean printable page (`/orders/[id]/brief`) with print stylesheet and Copy as text.
4. Tests: blocked when unconfirmed; every brief field maps to a confirmed field; stale brief flagged when the order changes.


