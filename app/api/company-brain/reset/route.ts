import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { resetCompanyBrain } from "@/server/services/companyBrain.service";

export async function POST() {
  try {
    const { workspace } = await requireWorkspace();
    const brain = await resetCompanyBrain(workspace.id);
    return NextResponse.json({ brain, message: "Company brain reset to InTheBox packaging standards" });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to reset company brain";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
