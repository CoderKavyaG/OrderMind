import { describe, it, expect } from "vitest";
import { ManualImportAdapter } from "@/server/services/adapters/manual-import.adapter";
import { NormalizedMessageSchema } from "@/server/db/schema";

describe("ManualImportAdapter Normalization", () => {
  const adapter = new ManualImportAdapter();

  it("normalizes chat export into validated NormalizedMessage schema", () => {
    const rawText = `
[14/10/24, 10:15:00 AM] Aarav Prints: Need 500 gift boxes
[14/10/24, 10:16:00 AM] Apex Packaging: Confirmed, we will prepare the die-line.
`;

    const normalized = adapter.normalize({
      conversationId: "conv-123",
      customerName: "Aarav Prints",
      rawText,
    });

    expect(normalized).toHaveLength(2);

    // Validate both against Zod schema
    for (const msg of normalized) {
      expect(() => NormalizedMessageSchema.parse(msg)).not.toThrow();
      expect(msg.source).toBe("manual");
      expect(msg.conversationId).toBe("conv-123");
    }

    // Role assignment
    expect(normalized[0].senderRole).toBe("customer");
    expect(normalized[1].senderRole).toBe("business");
  });

  it("assigns media types based on attached file metadata", () => {
    const rawText = `
[14/10/24, 10:20:00 AM] Aarav Prints: Here is the artwork
<attached: carton_mockup.png>
[14/10/24, 10:21:00 AM] Aarav Prints: <attached: voice_clarification.m4a>
[14/10/24, 10:22:00 AM] Aarav Prints: <attached: spec_sheet.pdf>
`;

    const attachments = [
      {
        attachment: {
          id: "att-img",
          filename: "carton_mockup.png",
          contentType: "image/png",
          size: 10240,
        },
        targetMessageIndex: 0,
        targetFilename: "carton_mockup.png",
      },
      {
        attachment: {
          id: "att-audio",
          filename: "voice_clarification.m4a",
          contentType: "audio/m4a",
          size: 40960,
        },
        targetMessageIndex: 1,
        targetFilename: "voice_clarification.m4a",
      },
      {
        attachment: {
          id: "att-pdf",
          filename: "spec_sheet.pdf",
          contentType: "application/pdf",
          size: 81920,
        },
        targetMessageIndex: 2,
        targetFilename: "spec_sheet.pdf",
      },
    ];

    const normalized = adapter.normalize({
      conversationId: "conv-media",
      customerName: "Aarav Prints",
      rawText,
      attachments,
    });

    expect(normalized[0].type).toBe("image");
    expect(normalized[0].attachments).toHaveLength(1);
    expect(normalized[0].attachments[0].filename).toBe("carton_mockup.png");

    expect(normalized[1].type).toBe("voice");
    expect(normalized[1].attachments).toHaveLength(1);

    expect(normalized[2].type).toBe("pdf");
    expect(normalized[2].attachments).toHaveLength(1);
  });
});
