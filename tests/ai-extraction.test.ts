import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockProvider } from "@/server/ai/mock.provider";
import { GemmaProvider } from "@/server/ai/gemma.provider";
import { processMessage, verifyQuoteSubstring } from "@/server/ai/extractor";
import { extractFieldsStage } from "@/server/ai/stages/extractFields";
import { interpretReferencesStage } from "@/server/ai/stages/interpretReferences";
import { extractFromImageStage } from "@/server/ai/stages/extractFromImage";
import type { MessageDoc } from "@/server/db/schema";

describe("Phase 4: Gemma Extraction Pipeline & Verification Engine", () => {
  let mockProvider: MockProvider;

  beforeEach(() => {
    mockProvider = new MockProvider();
  });

  describe("Quote Substring Verification (Zero-Hallucination Guard)", () => {
    it("accepts exact verbatim substring quotes", () => {
      const source = "Can we change quantity from 100 to 500 units instead?";
      const quote = "500 units";
      expect(verifyQuoteSubstring(quote, source)).toBe(true);
    });

    it("accepts quotes with normalized whitespace and newlines", () => {
      const source = "We need\n500 units of boxes";
      const quote = "500 units of boxes";
      expect(verifyQuoteSubstring(quote, source)).toBe(true);
    });

    it("rejects hallucinated quotes not present in the source text", () => {
      const source = "Can we make it a little taller?";
      const hallucinatedQuote = "Make it 20cm taller with blue ribbons";
      expect(verifyQuoteSubstring(hallucinatedQuote, source)).toBe(false);
    });
  });

  describe("Field Extraction Stage (Golden Fixtures)", () => {
    it("extracts absolute quantity and product type with op: 'set'", async () => {
      const targetMessage = {
        id: "msg-1",
        senderId: "Aarav Prints",
        senderRole: "customer" as const,
        content: "Let's start with 100 units of the rigid top-and-bottom box.",
      };

      const events = await extractFieldsStage({
        targetMessage,
        precedingMessages: [],
        workspaceId: "ws-1",
        conversationId: "conv-1",
        provider: mockProvider,
      });

      expect(events).toHaveLength(2);
      const qtyEvent = events.find((e) => e.field === "quantity");
      expect(qtyEvent).toBeDefined();
      expect(qtyEvent?.value).toBe(100);
      expect(qtyEvent?.op).toBe("set");
      expect(qtyEvent?.quote).toBe("100 units");
    });

    it("extracts quantity modification", async () => {
      const targetMessage = {
        id: "msg-2",
        senderId: "Aarav Prints",
        senderRole: "customer" as const,
        content:
          "Actually wait, our corporate client just expanded their order list. Can we change quantity from 100 to 500 units instead?",
      };

      const events = await extractFieldsStage({
        targetMessage,
        precedingMessages: [],
        workspaceId: "ws-1",
        conversationId: "conv-1",
        provider: mockProvider,
      });

      expect(events).toHaveLength(1);
      expect(events[0].field).toBe("quantity");
      expect(events[0].value).toBe(500);
      expect(events[0].op).toBe("set");
      expect(events[0].quote).toBe("change quantity from 100 to 500 units instead");
    });
  });

  describe("Reference Interpretation Stage (Deltas & Refs)", () => {
    it("interprets relative height adjustment ('make it a little taller') as op: 'delta'", async () => {
      const targetMessage = {
        id: "msg-3",
        senderId: "Aarav Prints",
        senderRole: "customer" as const,
        content:
          "Mostly yes, but can we make it a little taller? Add about 2.5 cm in height so the ceramic jars fit comfortably.",
      };

      const events = await interpretReferencesStage({
        targetMessage,
        precedingMessages: [],
        workspaceId: "ws-1",
        conversationId: "conv-1",
        provider: mockProvider,
      });

      expect(events).toHaveLength(1);
      expect(events[0].field).toBe("height");
      expect(events[0].op).toBe("delta");
      expect(events[0].value).toBe("+2.5 cm");
      expect(events[0].rawPhrase).toContain("make it a little taller");
    });

    it("interprets 'same as last time' as op: 'ref' and preserves the raw reference phrase", async () => {
      const targetMessage = {
        id: "msg-4",
        senderId: "Aarav Prints",
        senderRole: "customer" as const,
        content:
          "For the outer paper and inner tray, keep it same as last time - that dark navy textured kappa board with soft-touch lamination.",
      };

      const events = await interpretReferencesStage({
        targetMessage,
        precedingMessages: [],
        workspaceId: "ws-1",
        conversationId: "conv-1",
        provider: mockProvider,
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      const refEvent = events.find((e) => e.op === "ref");
      expect(refEvent).toBeDefined();
      expect(refEvent?.field).toBe("material");
      expect(refEvent?.op).toBe("ref");
      expect(refEvent?.quote).toBe("same as last time");
      expect(refEvent?.rawPhrase).toContain("same as last time");
    });
  });

  describe("Vision Extraction Stage & Fallback", () => {
    it("returns 'imageAnalyzed: false' fallback flag when model does not support vision", async () => {
      mockProvider.setSupportsVision(false);

      const targetMessage = {
        id: "msg-img",
        senderId: "Aarav Prints",
        senderRole: "customer" as const,
        content: "<attached: diwali_hamper_box_mockup.png>",
        attachments: [
          {
            id: "att-1",
            filename: "diwali_hamper_box_mockup.png",
            contentType: "image/png",
            size: 1024,
          },
        ],
      };

      const result = await extractFromImageStage({
        targetMessage,
        workspaceId: "ws-1",
        conversationId: "conv-1",
        provider: mockProvider,
      });

      expect(result.imageAnalyzed).toBe(false);
      expect(result.reason).toContain("does not support multimodal vision");
      expect(result.events).toHaveLength(0);
    });

    it("extracts design specs when model supports vision", async () => {
      mockProvider.setSupportsVision(true);

      const targetMessage = {
        id: "msg-img",
        senderId: "Aarav Prints",
        senderRole: "customer" as const,
        content: "Here is the revised artwork: <attached: diwali_hamper_box_mockup.png>",
        attachments: [
          {
            id: "att-1",
            filename: "diwali_hamper_box_mockup.png",
            contentType: "image/png",
            size: 1024,
          },
        ],
      };

      const result = await extractFromImageStage({
        targetMessage,
        workspaceId: "ws-1",
        conversationId: "conv-1",
        provider: mockProvider,
      });

      expect(result.imageAnalyzed).toBe(true);
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].quote).toBe("[Image Attachment: diwali_hamper_box_mockup.png]");
    });
  });

  describe("Pipeline Orchestrator & Hallucination Rejection", () => {
    it("rejects hallucinated quotes fabricated by LLM", async () => {
      const message: MessageDoc & { id: string } = {
        id: "msg-fake",
        workspaceId: "ws-1",
        conversationId: "conv-1",
        source: "manual",
        senderId: "Aarav Prints",
        senderRole: "customer",
        timestamp: new Date(),
        type: "text",
        content: "Please deliver before Friday.",
        attachments: [],
        createdAt: new Date(),
      };

      // Mock provider returns an event with a quote completely absent from content
      mockProvider.enqueueResponse({
        events: [
          {
            field: "material",
            value: "350 GSM White SBS board",
            op: "set",
            quote: "We want 350 GSM White SBS board with gold foil", // NOT in source!
            confidence: 0.99,
          },
        ],
      });

      const result = await processMessage(message, [], "ws-1", mockProvider);

      expect(result.status).toBe("processed");
      // The hallucinated quote was rejected by the quote verifier
      expect(result.events).toHaveLength(0);
    });

    it("handles invalid JSON with single retry mechanism in GemmaProvider", async () => {
      const gemma = new GemmaProvider();
      let callCount = 0;

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // Attempt 1: returns malformed JSON
          return {
            ok: true,
            status: 200,
            json: async () => ({
              message: { content: "```json\n{ invalid_json: missing_quotes \n```" },
            }),
          };
        }
        // Attempt 2 (retry): returns valid JSON
        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: {
              content: '{"events": [{"field": "deadline", "value": "November 2nd", "quote": "November 2nd", "confidence": 0.95}]}',
            },
          }),
        };
      });

      try {
        const result = await gemma.generateJSON<{ events: Array<{ field: string; value: string }> }>({
          prompt: "Extract deadline from: Critical deadline is November 2nd.",
        });

        expect(callCount).toBe(2);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].field).toBe("deadline");
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});

