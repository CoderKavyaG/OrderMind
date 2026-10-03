import type { NormalizedMessage } from "@/server/db/schema";

/**
 * Common ChannelAdapter interface.
 * All communication channels (Manual Import, WhatsApp, Instagram, etc.)
 * must normalize raw inputs into the unified NormalizedMessage format.
 * No channel-specific business logic should leak into the rest of the application.
 */
export interface ChannelAdapter {
  readonly channelType: "manual" | "whatsapp" | "instagram";
  
  /**
   * Normalizes raw platform-specific payload/text/files into an array of NormalizedMessage
   */
  normalize(rawInput: unknown): NormalizedMessage[];
}
