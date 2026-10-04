# OrderMind — Architecture & Data Flow Specification

OrderMind transforms chaotic customer communications (WhatsApp exports, audio recordings, photo dumps, PDF spec sheets) into verified, deterministic production orders for packaging manufacturers.

```mermaid
flowchart TD
    A[Client Communications\nWhatsApp / Voice / Photos / PDFs] --> B[Manual Import / Ingestion Engine]
    B --> C[Internal Normalized Message Model\nNormalizedMessage]
    C --> D[Gemma Modular Extraction Pipeline]
    
    subgraph AI Pipeline [Gemma Open-Source Pipeline]
        D1[extractFields.ts] --> D4[Zod Schema Validation]
        D2[interpretReferences.ts] --> D4
        D3[extractFromImage.ts] --> D4
        D4 --> D5[Quote Verification Guard]
        D5 -->|Hallucination Detected| D6[Reject & Flag]
        D5 -->|Valid Quote| D7[ExtractedEvent Persisted]
    end

    D --> D1 & D2 & D3
    D7 --> E[Deterministic Order Reducer]
    
    subgraph State Engine [Order State Engine & Conflict Detection]
        E --> F1[Order State Matrix\nCONFIRMED / INFERRED / MISSING / CONFLICTING]
        F1 --> F2[Conflict Detector\nDraft vs Historical Ref]
        F1 --> F3[Missing Info Detector\nRequired Field Set]
        F1 --> F4[Change Detector\nTimeline Diffs]
    end

    F1 --> G[Human Review & Resolution UI]
    G -->|Resolve / Confirm| H[Confirmed Order Version]
    H --> I[Production Brief Generator]
    H --> J[Customer Memory Engine]
```

---

## Core Invariants

1. **LLM Never Mutates Order State Directly**: The AI model only produces immutable `ExtractedEvent` claims containing the verbatim quote and message ID.
2. **Deterministic State Computation**: The `orderReducer` computes field values and truth statuses (`CONFIRMED`, `INFERRED`, `MISSING`, `CONFLICTING`) purely based on the historical event stream.
3. **Strict Quote Verification**: Any AI claim whose quote is not found in the original source text is rejected by `verifyQuoteInText()`.
4. **Tenant Isolation**: Every database read and write is strictly filtered by the session's verified `workspaceId`.
5. **Human In The Loop**: Any inferred value or historical reference must be confirmed or resolved by a human operator before moving to `CONFIRMED`.
