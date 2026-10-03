import type { LLMProvider } from "../provider.interface";
import type { ExtractedEvent, AttachmentMeta } from "@/server/db/schema";
import { traceAgentStage } from "@/server/observability/tracer";
import type { MessageContext } from "./extractFields";

export interface ExtractFromImageInput {
  targetMessage: MessageContext & { attachments?: AttachmentMeta[] };
  workspaceId: string;
  conversationId: string;
  provider: LLMProvider;
  getImageBase64?: (attachmentId: string) => Promise<{ base64: string; mimeType: string } | null>;
}

export interface ImageExtractionResult {
  imageAnalyzed: boolean;
  reason?: string;
  description?: string;
  events: ExtractedEvent[];
}

interface RawVisionOutput {
  imageAnalyzed?: boolean;
  description?: string;
  events?: Array<{
    field: string;
    value: string | number;
    unit?: string;
    confidence: number;
  }>;
}

export async function extractFromImageStage(
  input: ExtractFromImageInput
): Promise<ImageExtractionResult> {
  const { targetMessage, workspaceId, conversationId, provider, getImageBase64 } = input;

  const imageAttachments = (targetMessage.attachments || []).filter(
    (att) =>
      att.contentType?.startsWith("image/") ||
      att.filename?.match(/\.(png|jpg|jpeg|webp)$/i)
  );

  if (imageAttachments.length === 0) {
    return { imageAnalyzed: false, reason: "No image attachments present on message", events: [] };
  }

  const primaryImage = imageAttachments[0];

  // 1. Verify vision support on configured LLM model
  if (!provider.supportsVision()) {
    return {
      imageAnalyzed: false,
      reason: `Configured model "${provider.modelName}" does not support multimodal vision. Image "${primaryImage.filename}" skipped with fallback flag.`,
      events: [],
    };
  }

  // 2. Load image payload if loader provided
  let imagePayloads: Array<{ base64: string; mimeType: string; filename: string }> = [];
  if (getImageBase64) {
    const loaded = await getImageBase64(primaryImage.id);
    if (loaded) {
      imagePayloads = [{ ...loaded, filename: primaryImage.filename }];
    }
  } else {
    imagePayloads = [
      {
        base64: "",
        mimeType: primaryImage.contentType || "image/png",
        filename: primaryImage.filename,
      },
    ];
  }

  const prompt = `Analyze this packaging reference design or mockup image: "${primaryImage.filename}".
Extract visible manufacturing specifications:
- product_type: box/pouch/carton structure (e.g. "rigid top-and-bottom box", "magnetic flap box", "mailer carton")
- finish: visible surface treatment (e.g. "matte lamination", "gold foil stamping", "spot UV gloss", "embossed")
- printing: colors/pattern (e.g. "solid navy blue background", "CMYK full color print")
- logo_placement: placement coordinates (e.g. "centered on top lid", "lower right corner")

Provide a 1-sentence description of the visual sample.
Output strictly valid JSON:
{
  "imageAnalyzed": true,
  "description": "...",
  "events": [
    {"field": "product_type", "value": "...", "confidence": 0.9},
    {"field": "finish", "value": "...", "confidence": 0.88}
  ]
}`;

  return traceAgentStage(
    "image",
    {
      model: provider.modelName,
      metadata: {
        workspaceId,
        conversationId,
        messageId: targetMessage.id,
        filename: primaryImage.filename,
      },
    },
    async () => {
      try {
        const res = await provider.generateJSON<RawVisionOutput>({
          system: "You are an expert packaging structural and finish analyzer with vision capabilities. Output strictly valid JSON.",
          prompt,
          images: imagePayloads,
        });

        if (!res || !Array.isArray(res.events)) {
          return {
            imageAnalyzed: res?.imageAnalyzed ?? true,
            description: res?.description,
            events: [],
          };
        }

        const events: ExtractedEvent[] = res.events.map((e) => ({
          workspaceId,
          conversationId,
          messageId: targetMessage.id,
          field: e.field,
          value: e.value,
          unit: e.unit,
          op: "set" as const,
          quote: `[Image Attachment: ${primaryImage.filename}]`,
          confidence: Math.max(0, Math.min(1, typeof e.confidence === "number" ? e.confidence : 0.85)),
          stage: "image_vision" as const,
          createdAt: new Date(),
        }));

        return {
          imageAnalyzed: true,
          description: res.description,
          events,
        };
      } catch (err) {
        return {
          imageAnalyzed: false,
          reason: `Vision extraction failed: ${(err as Error).message}`,
          events: [],
        };
      }
    }
  );
}
