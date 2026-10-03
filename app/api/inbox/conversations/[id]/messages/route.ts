import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { addMessageToConversation } from "@/server/services/inbox.service";
import { z } from "zod";

const AddMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  senderRole: z.enum(["customer", "business"]).optional().default("customer"),
  senderId: z.string().optional(),
  type: z.enum(["text", "image", "voice", "pdf"]).optional(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        filename: z.string(),
        contentType: z.string(),
        size: z.number().optional(),
        url: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const json = await request.json();
    const parsed = AddMessageSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const message = await addMessageToConversation(
      workspace.id,
      params.id,
      parsed.data as any
    );

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to add message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
