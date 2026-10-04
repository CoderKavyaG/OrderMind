# OrderMind Wiring & Backend Checklist (WIRING_TODO.md)

This checklist tracks UI elements and operator interactions that require backend endpoints, database persistence, or data model wiring.

---

## 1. Inbox Interactions

- [ ] **Thread Reply Input Bar**
  - **Button / Trigger:** "Send" or `Enter` in the bottom chat bar of the WhatsApp thread view.
  - **Intended Action:** Append a new outgoing operator message or customer incoming reply to the active conversation.
  - **Endpoint Needed:** `POST /api/inbox/conversations/[id]/messages`
  - **Payload:** `{ senderRole: "business" | "customer", content: string, type: "text" }`
  - **Downstream:** Appends to `messages` collection, triggers Gemma extraction pipeline if customer message.

- [ ] **Thread Attachment Dropzone in Active Chat**
  - **Button / Trigger:** Paperclip icon in chat thread.
  - **Intended Action:** Upload an image / PDF / audio note directly to an existing conversation.
  - **Endpoint Needed:** `POST /api/inbox/conversations/[id]/attachments`
  - **Payload:** `multipart/form-data` (file, targetMessageId)

---

## 2. Order & Lifecycle Transitions (R4 Scope) — COMPLETED

- [x] **Lifecycle Stage Selector & Stage Gates** (Completed in R4)
  - **Button / Trigger:** Stage change dropdown on `/orders/[id]` header and Order Matrix board/table.
  - **Intended Action:** Update order lifecycle stage with strict server-side stage-gate validation.
  - **Endpoint Active:** `PATCH /api/orders/[id]/stage` and `POST /api/orders/[id]/stage` (record `design_approved` and `advance_paid`).
  - **Validation Rule:** Cannot enter `Production` unless both `Design approved` and `Advance paid` human events are recorded.

- [x] **Order Type Selector** (Completed in R4)
  - **Button / Trigger:** Order creation modal or type dropdown on `/orders/[id]` (`consultation` | `design` | `manufacturing`).
  - **Intended Action:** Assign `orderType`, switching the required packaging field validator set.
  - **Endpoint Active:** `PATCH /api/orders/[id]/type` and `POST /api/orders`


---

## 3. Settings & Company Brain (R1 Scope)

- [ ] **Settings Profile Update**
  - **Button / Trigger:** "Save Changes" button on `/settings` profile form.
  - **Intended Action:** Update workspace business name, industry, and contact settings.
  - **Endpoint Needed:** `PATCH /api/workspace`
  - **Payload:** `{ name: string, industry: string }`

- [ ] **Company Brain Catalogue Editor**
  - **Location:** `/settings/company-brain` (or tab in Settings).
  - **Button / Trigger:** "Save Brain Specifications" button.
  - **Intended Action:** Read/write versioned Company Brain (services, INR price table, finishes, materials, policies, out-of-scope rules).
  - **Endpoint Needed:** `GET /api/company-brain` and `PUT /api/company-brain`
  - **Downstream:** Used by deterministic price lookup service for consultation/design packages and manufacturing quote flags.

---

## 4. Brand & SKU Management (R1 & R2 Scope) — COMPLETED

- [x] **Brand Creator** (Completed in R2)
  - **Button / Trigger:** "Add Brand" on Client view (`/customers/[id]`).
  - **Intended Action:** Attach multiple brands to a client with full CRUD.
  - **Endpoint Active:** `POST /api/brands`, `GET /api/brands?clientId=...`, `PATCH /api/brands/[id]`, `DELETE /api/brands/[id]`

- [x] **Product / SKU Manager** (Completed in R2)
  - **Button / Trigger:** "Add SKU" on Brand view under Client detail page.
  - **Intended Action:** Create product with specifications `{ structure, dimensions, materials, finish, accessories }` and reference photo upload/lightbox gallery.
  - **Endpoint Active:** `POST /api/products`, `GET /api/products?brandId=...`, `PATCH /api/products/[id]`, `DELETE /api/products/[id]`

- [x] **Workspace Notes & Tasks** (Completed in R1 & R2)
  - **Button / Trigger:** "Add Task / Note" in workspace shell and Client Notes tab.
  - **Intended Action:** Record schedule events (`deadline`, `followup`, `approval`, `payment`, `consultation`, `production`) and notes (`workspace` | `client` | `order`) with pinning, search, and editing.
  - **Endpoint Active:** `POST /api/tasks`, `PATCH /api/tasks/[id]`, `POST /api/notes`, `PATCH /api/notes/[id]`, `DELETE /api/notes/[id]`

