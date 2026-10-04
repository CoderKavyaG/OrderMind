import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { getWorkspaceDashboardData } from "@/server/services/workspaceHome.service";

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const data = await getWorkspaceDashboardData(workspace.id);
    return NextResponse.json({ ...data, workspaceName: workspace.name });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to load workspace dashboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
