import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { storeAttachment } from "@/server/services/attachment.service";
import { checkRateLimit } from "@/server/auth/rate-limit";

export async function POST(request: Request) {
  try {
    const { workspace, user } = await requireWorkspace();

    const rateCheck = checkRateLimit(`upload:${user.id}`, { maxAttempts: 60, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Please wait a moment before uploading more files." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderId = (formData.get("orderId") as string | null) || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const attachment = await storeAttachment(
      workspace.id,
      buffer,
      file.name,
      file.type || "application/octet-stream",
      orderId
    );

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "File upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
