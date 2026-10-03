import type { ChannelAdapter } from "./channel-adapter.interface";
import type { NormalizedMessage } from "@/server/db/schema";

/**
 * WhatsAppAdapter (Stub - Planned for subsequent phase)
 * Will interface with the Meta Cloud API / WhatsApp Business Platform webhooks
 * to convert live WhatsApp webhook payloads into NormalizedMessage items.
 */
export class WhatsAppAdapter implements ChannelAdapter {
  readonly channelType = "whatsapp" as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  normalize(_rawInput: unknown): NormalizedMessage[] {
    throw new Error(
      "WhatsAppAdapter is not implemented yet. Live Meta integration is planned for later phases. Please use ManualImportAdapter."
    );
  }
}
