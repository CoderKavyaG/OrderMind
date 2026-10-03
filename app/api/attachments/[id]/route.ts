import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { requireWorkspace } from "@/server/auth/workspace";
import { getAttachmentStream } from "@/server/services/attachment.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const fileData = await getAttachmentStream(workspace.id, params.id);

    if (!fileData) {
      return NextResponse.json({ error: "Attachment not found or access denied" }, { status: 404 });
    }

    // Convert NodeJS Readable to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        fileData.stream.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        fileData.stream.on("end", () => {
          controller.close();
        });
        fileData.stream.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        if ("destroy" in fileData.stream) {
          (fileData.stream as unknown as { destroy: () => void }).destroy();
        }
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", fileData.contentType);
    headers.set("Content-Length", fileData.length.toString());
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(fileData.filename)}"`);
    headers.set("Cache-Control", "public, max-age=86400, immutable");

    return new Response(webStream, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load attachment";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
