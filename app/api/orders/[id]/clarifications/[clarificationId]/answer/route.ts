import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { handleAnswerReceived } from "@/server/services/missingDetector";

export async function POST(
  request: Request,
  { params }: { params: { id: string; clarificationId: string } }
) {
  try {
    const { workspace, user } = await requireWorkspace();
    const body = await request.json();

    const replyText = body.replyText;
    if (!replyText || typeof replyText !== "string" || !replyText.trim()) {
      return NextResponse.json({ error: "Customer reply text is required" }, { status: 400 });
    }

    const result = await handleAnswerReceived(
      workspace.id,
      params.id,
      params.clarificationId,
      replyText.trim(),
      user.email
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to record customer reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
