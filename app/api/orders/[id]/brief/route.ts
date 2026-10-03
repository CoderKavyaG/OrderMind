import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import {
  generateProductionBrief,
  getProductionBrief,
} from "@/server/services/productionBrief.service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const brief = await getProductionBrief(workspace.id, params.id);

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load production brief";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const brief = await generateProductionBrief(workspace.id, params.id);

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to generate production brief";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
