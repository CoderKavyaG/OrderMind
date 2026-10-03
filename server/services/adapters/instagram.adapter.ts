import type { ChannelAdapter } from "./channel-adapter.interface";
import type { NormalizedMessage } from "@/server/db/schema";

/**
 * InstagramAdapter (Stub - Planned for subsequent phase)
 * Will interface with the Meta Graph API / Instagram Direct Messages webhooks
 * to convert live Instagram message payloads into NormalizedMessage items.
 */
export class InstagramAdapter implements ChannelAdapter {
  readonly channelType = "instagram" as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  normalize(_rawInput: unknown): NormalizedMessage[] {
    throw new Error(
      "InstagramAdapter is not implemented yet. Live Meta Instagram integration is planned for later phases. Please use ManualImportAdapter."
    );
  }
}
