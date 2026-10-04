import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { searchGlobal } from "@/server/services/globalSearch.service";

export async function GET(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";

    const results = await searchGlobal(workspace.id, q);
    return NextResponse.json({ results });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
