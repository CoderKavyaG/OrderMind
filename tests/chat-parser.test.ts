import { describe, it, expect } from "vitest";
import { parseWhatsAppExport } from "@/server/services/chat-parser.service";

describe("WhatsApp Chat Export Parser (3 Standard Formats)", () => {
  it("Format 1: parses iOS bracketed export format with 12h AM/PM time", () => {
    const raw = `
[14/10/24, 10:15:22 AM] Aarav Prints: Need 500 rigid boxes
[14/10/24, 10:16:05 AM] Packaging Factory: Received, what size?
`;
    const parsed = parseWhatsAppExport(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].senderName).toBe("Aarav Prints");
    expect(parsed[0].content).toBe("Need 500 rigid boxes");
    expect(parsed[1].senderName).toBe("Packaging Factory");
    expect(parsed[1].content).toBe("Received, what size?");
  });

  it("Format 2: parses Android export format with dash separator", () => {
    const raw = `
14/10/24, 2:30 pm - Aarav Prints: Can we make it a little taller?
14/10/24, 2:35 pm - Apex Packaging: Yes, adding 25mm to box height.
`;
    const parsed = parseWhatsAppExport(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].senderName).toBe("Aarav Prints");
    expect(parsed[0].content).toBe("Can we make it a little taller?");
    expect(parsed[1].senderName).toBe("Apex Packaging");
    expect(parsed[1].content).toBe("Yes, adding 25mm to box height.");
  });

  it("Format 3: parses ISO / 24-hour export format", () => {
    const raw = `
2024-10-14 14:30:00 - Aarav Prints: Use the metallic gold foil on top
2024-10-14 14:32:00 - Apex Packaging: Confirmed, hot-stamped gold foil.
`;
    const parsed = parseWhatsAppExport(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].senderName).toBe("Aarav Prints");
    expect(parsed[0].content).toBe("Use the metallic gold foil on top");
  });

  it("handles multi-line messages accurately without splitting into separate items", () => {
    const raw = `
[14/10/24, 10:20:00 AM] Aarav Prints: Here are the three specifications:
1. 350 GSM Kappa board
2. Navy blue soft touch lamination
3. Delivery to Surat warehouse
[14/10/24, 10:22:00 AM] Apex Packaging: Perfect, all noted.
`;
    const parsed = parseWhatsAppExport(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].content).toContain("1. 350 GSM Kappa board");
    expect(parsed[0].content).toContain("3. Delivery to Surat warehouse");
  });

  it("extracts attachment indicators and filenames correctly", () => {
    const raw = `
[14/10/24, 10:23:00 AM] Aarav Prints: Artwork attached:
<attached: diwali_hamper_box_mockup.png>
[14/10/24, 10:24:10 AM] Aarav Prints: <attached: voice_specs_clarification.m4a>
`;
    const parsed = parseWhatsAppExport(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].hasAttachmentIndicator).toBe(true);
    expect(parsed[0].attachmentFilename).toBe("diwali_hamper_box_mockup.png");
    expect(parsed[1].hasAttachmentIndicator).toBe(true);
    expect(parsed[1].attachmentFilename).toBe("voice_specs_clarification.m4a");
  });
});
