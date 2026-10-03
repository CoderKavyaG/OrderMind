import type { ChannelAdapter } from "./channel-adapter.interface";
import {
  type NormalizedMessage,
  type AttachmentMeta,
  type SenderRole,
  type MessageType,
  NormalizedMessageSchema,
} from "@/server/db/schema";
import { parseWhatsAppExport } from "../chat-parser.service";

export interface ManualImportPayload {
  conversationId: string;
  customerName: string;
  businessName?: string;
  rawText: string;
  attachments?: Array<{
    attachment: AttachmentMeta;
    targetMessageIndex?: number;
    targetFilename?: string;
  }>;
}

export class ManualImportAdapter implements ChannelAdapter {
  readonly channelType = "manual" as const;

  /**
   * Normalizes raw manual import text and associated attachments into NormalizedMessage array.
   */
  normalize(rawInput: unknown): NormalizedMessage[] {
    const input = rawInput as ManualImportPayload;
    if (!input || typeof input.rawText !== "string") {
      throw new Error("Invalid manual import input: rawText string is required");
    }

    const conversationId = input.conversationId || "temp-conv";
    const customerNameLower = (input.customerName || "").trim().toLowerCase();
    const parsedMessages = parseWhatsAppExport(input.rawText);

    const attachmentsList = input.attachments || [];

    const normalizedList: NormalizedMessage[] = parsedMessages.map((msg, index) => {
      const senderLower = msg.senderName.toLowerCase();
      // Determine if message is from customer or business
      let senderRole: SenderRole = "customer";
      if (customerNameLower) {
        if (senderLower.includes(customerNameLower) || customerNameLower.includes(senderLower)) {
          senderRole = "customer";
        } else {
          senderRole = "business";
        }
      } else {
        // Fallback: first sender is assumed customer unless known otherwise
        senderRole = index % 2 === 0 ? "customer" : "business";
      }

      // Match attachments for this message
      const msgAttachments: AttachmentMeta[] = [];

      for (const att of attachmentsList) {
        let isMatch = false;
        if (typeof att.targetMessageIndex === "number" && att.targetMessageIndex === index) {
          isMatch = true;
        } else if (
          msg.attachmentFilename &&
          att.attachment.filename.toLowerCase() === msg.attachmentFilename.toLowerCase()
        ) {
          isMatch = true;
        } else if (
          att.targetFilename &&
          msg.attachmentFilename &&
          att.targetFilename.toLowerCase() === msg.attachmentFilename.toLowerCase()
        ) {
          isMatch = true;
        }

        if (isMatch) {
          msgAttachments.push(att.attachment);
        }
      }

      // Determine message type
      let messageType: MessageType = "text";
      if (msgAttachments.length > 0) {
        const firstType = msgAttachments[0].contentType.toLowerCase();
        if (firstType.startsWith("image/")) {
          messageType = "image";
        } else if (firstType.startsWith("audio/") || firstType.includes("ogg") || firstType.includes("audio")) {
          messageType = "voice";
        } else if (firstType === "application/pdf" || firstType.includes("pdf")) {
          messageType = "pdf";
        }
      } else if (msg.hasAttachmentIndicator) {
        const fname = (msg.attachmentFilename || "").toLowerCase();
        if (fname.endsWith(".pdf")) messageType = "pdf";
        else if (fname.endsWith(".opus") || fname.endsWith(".ogg") || fname.endsWith(".mp3") || fname.endsWith(".m4a") || fname.endsWith(".wav")) {
          messageType = "voice";
        } else if (fname.endsWith(".png") || fname.endsWith(".jpg") || fname.endsWith(".jpeg") || fname.endsWith(".webp")) {
          messageType = "image";
        }
      }

      const normalized: NormalizedMessage = {
        source: "manual",
        conversationId,
        senderId: msg.senderName,
        senderRole,
        timestamp: msg.timestamp,
        type: messageType,
        content: msg.content,
        attachments: msgAttachments,
      };

      return NormalizedMessageSchema.parse(normalized);
    });

    return normalizedList;
  }
}
