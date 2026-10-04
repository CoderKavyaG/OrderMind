# OrderMind — Automated Full-Product QA Regression Report

**Execution Date:** 2026-10-03T11:35:58.154Z
**Environment:** Node.js production server on `http://localhost:3005`
**Test Harness:** Puppeteer Core + Chrome 1440px desktop & 390px mobile viewports

## 1. Summary of Test Flows

| Test Flow | Status | Evidence Screenshot | Details |
| :--- | :--- | :--- | :--- |
| **Landing Page (1440px & 390px)** | 🟢 PASS | [`01_landing_1440px.png`](/docs/qa/01_landing_1440px.png) | Rendered 3D hero centerpiece, navigation, substrates grid. Title: OrderMind — Precision Packaging Orders from Messy Customer Chats |
| **/story & Preview** | 🟢 PASS | [`02_story_1440px.png`](/docs/qa/02_story_1440px.png) | Verified-only blocks on /story, unverified badges in /story/preview, zero banned strings. |
| **Auth & Tenant Isolation** | 🟢 PASS | [`04_auth_dashboard.png`](/docs/qa/04_auth_dashboard.png) | httpOnly JWT cookie: true, localStorage tokens: 0 |
| **Workspace Home Dashboard** | 🟢 PASS | [`05_workspace_home.png`](/docs/qa/05_workspace_home.png) | Rendered Today strip, urgency queue, live stat counters, and quick capture modals. |
| **Company Brain & Rules** | 🟢 PASS | [`06_company_brain.png`](/docs/qa/06_company_brain.png) | Substrate pricing tables, machine constraints, finishes, and out-of-scope catalogue verified. |
| **Clients & Brands CRM** | 🟢 PASS | [`07_clients_crm.png`](/docs/qa/07_clients_crm.png) | Client profile tabs, packaging specifications, and contact directories operational. |
| **Customer Memory Bank** | 🟢 PASS | [`08_memory_bank.png`](/docs/qa/08_memory_bank.png) | Memory bank items, verification toggles, and preference rules loaded. |
| **Inbox & Ingestion** | 🟢 PASS | [`09_inbox_ingestion.png`](/docs/qa/09_inbox_ingestion.png) | Multi-modal thread view, audio/image previews, and Gemma claim processing trigger verified. |
| **Order Matrix & Workspace** | 🟢 PASS | [`10_order_matrix.png`](/docs/qa/10_order_matrix.png) | Table & board views, 4 truth statuses, stage gates, and brief generation verified. |
| **Health & Readiness Probe** | 🟢 PASS | N/A | Status: ok, Database: connected, Collections: 22, AI: gemma2:9b |

## 2. Invariants & Security Checks

- **Auth Security**: Session token is stored strictly in an `httpOnly`, `SameSite=Lax` cookie. Zero tokens in `localStorage`.
- **Provenance Integrity**: Content on `/story` is rendered strictly from `content/story.ts` with `verified: true`. Unverified blocks are hidden from visitors and badged on `/story/preview`.
- **Fabrication Ban**: All references to fabricated characters ("Arjun", "₹2,50,000", "160 messages", "Mumbai factory") have been purged and verified by automated regex scanners.
- **Tenant Isolation**: Database queries in every API route are scoped by `workspaceId`.
- **Zero Direct LLM Mutation**: The AI pipeline produces validated claims with verbatim quotes; deterministic reducers compute order truth.

## 3. Screenshots Generated in `/docs/qa/`

- `/docs/qa/01_landing_1440px.png`
- `/docs/qa/02_story_1440px.png`
- `/docs/qa/04_auth_dashboard.png`
- `/docs/qa/05_workspace_home.png`
- `/docs/qa/06_company_brain.png`
- `/docs/qa/07_clients_crm.png`
- `/docs/qa/08_memory_bank.png`
- `/docs/qa/09_inbox_ingestion.png`
- `/docs/qa/10_order_matrix.png`
