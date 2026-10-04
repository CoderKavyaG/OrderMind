import { getDb } from "@/server/db/mongodb";
import type { Channel } from "@/server/db/schema";

export interface ChannelItem {
  id: string;
  type: "manual" | "whatsapp" | "instagram";
  name: string;
  description: string;
  status: "active" | "coming_soon";
  details: string;
}

export async function getChannelsForWorkspace(workspaceId: string): Promise<ChannelItem[]> {
  const db = await getDb();
  
  // Ensure default channels exist for this workspace if not already created
  const existing = await db.collection<Channel>("channels").find({ workspaceId }).toArray();
  
  if (existing.length === 0) {
    const defaults = [
      {
        workspaceId,
        type: "manual" as const,
        name: "Manual Chat & File Import",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        workspaceId,
        type: "whatsapp" as const,
        name: "WhatsApp Business API",
        status: "coming_soon" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        workspaceId,
        type: "instagram" as const,
        name: "Instagram Direct Messages",
        status: "coming_soon" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await db.collection("channels").insertMany(defaults);
  }

  return [
    {
      id: "manual",
      type: "manual",
      name: "Manual Chat & File Import",
      description: "Paste or upload WhatsApp .txt chat transcripts, attach PDFs, voice recordings, and mockups.",
      status: "active",
      details: "Normalizes multi-line WhatsApp exports directly into structured order evidence.",
    },
    {
      id: "whatsapp",
      type: "whatsapp",
      name: "WhatsApp Cloud API",
      description: "Direct real-time webhook ingestion for enterprise WhatsApp Business accounts.",
      status: "coming_soon",
      details: "Adapter architecture ready. Scheduled for next release phase.",
    },
    {
      id: "instagram",
      type: "instagram",
      name: "Instagram Direct",
      description: "Automated direct message capture from Instagram business creator inboxes.",
      status: "coming_soon",
      details: "Adapter architecture ready. Scheduled for next release phase.",
    },
  ];
}
