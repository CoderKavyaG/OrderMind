import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { transcribeAndProcessVoiceMessage } from "@/server/ai/transcribe";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json().catch(() => ({}));

    const message = await transcribeAndProcessVoiceMessage(
      workspace.id,
      params.id,
      body.manualText
    );

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Voice transcription failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
