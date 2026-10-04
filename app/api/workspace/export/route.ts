import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { getDb } from "@/server/db/mongodb";

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const db = await getDb();
    const workspaceId = workspace.id;

    // Fetch all tenant-scoped data in parallel
    const [
      members,
      clients,
      conversations,
      messages,
      extractedEvents,
      orders,
      orderEvents,
      orderVersions,
      tasks,
      notes,
      scheduleEvents,
      companyBrain,
      customerMemory,
      attachments,
    ] = await Promise.all([
      db.collection("members").find({ workspaceId }).toArray(),
      db.collection("clients").find({ workspaceId }).toArray(),
      db.collection("conversations").find({ workspaceId }).toArray(),
      db.collection("messages").find({ workspaceId }).toArray(),
      db.collection("extracted_events").find({ workspaceId }).toArray(),
      db.collection("orders").find({ workspaceId }).toArray(),
      db.collection("order_events").find({ workspaceId }).toArray(),
      db.collection("order_versions").find({ workspaceId }).toArray(),
      db.collection("tasks").find({ workspaceId }).toArray(),
      db.collection("notes").find({ workspaceId }).toArray(),
      db.collection("schedule_events").find({ workspaceId }).toArray(),
      db.collection("company_brain").findOne({ workspaceId }),
      db.collection("customer_memory").find({ workspaceId }).toArray(),
      db.collection("attachments").find({ workspaceId }).toArray(),
    ]);

    const exportPayload = {
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      workspace,
      data: {
        members,
        clients,
        conversations,
        messages,
        extractedEvents,
        orders,
        orderEvents,
        orderVersions,
        tasks,
        notes,
        scheduleEvents,
        companyBrain: companyBrain || null,
        customerMemory,
        attachmentsMetadata: attachments,
      },
    };

    const sanitizedName = workspace.name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const filename = `ordermind_export_${sanitizedName}_${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to export workspace data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
