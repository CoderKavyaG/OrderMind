import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { getDb, getGridFSBucket } from "@/server/db/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(request: Request) {
  try {
    const { workspace, role } = await requireWorkspace();

    if (role !== "OWNER") {
      return NextResponse.json(
        { error: "Only workspace owners can delete or purge a workspace." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const confirmName = body.confirmName?.trim();

    if (confirmName !== workspace.name.trim()) {
      return NextResponse.json(
        { error: `Confirmation mismatch. Please type the exact workspace name "${workspace.name}" to confirm.` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const workspaceId = workspace.id;

    // Remove any GridFS files associated with attachments
    try {
      const bucket = await getGridFSBucket();
      const attachments = await db.collection("attachments").find({ workspaceId }).toArray();
      for (const att of attachments) {
        if (att.fileId) {
          await bucket.delete(new ObjectId(att.fileId as string)).catch(() => {});
        }
      }
    } catch {
      // Ignore GridFS cleanup error if already removed
    }

    // Delete all tenant-scoped records
    await Promise.all([
      db.collection("workspaces").deleteOne({ _id: new ObjectId(workspaceId) }),
      db.collection("members").deleteMany({ workspaceId }),
      db.collection("clients").deleteMany({ workspaceId }),
      db.collection("conversations").deleteMany({ workspaceId }),
      db.collection("messages").deleteMany({ workspaceId }),
      db.collection("extracted_events").deleteMany({ workspaceId }),
      db.collection("orders").deleteMany({ workspaceId }),
      db.collection("order_events").deleteMany({ workspaceId }),
      db.collection("order_versions").deleteMany({ workspaceId }),
      db.collection("tasks").deleteMany({ workspaceId }),
      db.collection("notes").deleteMany({ workspaceId }),
      db.collection("schedule_events").deleteMany({ workspaceId }),
      db.collection("company_brain").deleteMany({ workspaceId }),
      db.collection("customer_memory").deleteMany({ workspaceId }),
      db.collection("attachments").deleteMany({ workspaceId }),
    ]);

    const response = NextResponse.json({
      success: true,
      message: `Workspace "${workspace.name}" and all associated data have been permanently deleted.`,
    });

    // Clear active workspace cookie if needed
    response.cookies.delete("ordermind_active_workspace");

    return response;
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to delete workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
