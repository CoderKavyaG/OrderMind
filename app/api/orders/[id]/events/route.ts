import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { applyHumanOrderAction } from "@/server/services/order.service";

const HumanActionPayloadSchema = z.object({
  field: z.string().optional(),
  action: z.enum(["confirm", "edit", "resolve_conflict", "confirm_all"]),
  newValue: z.unknown().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace, user } = await requireWorkspace();
    const body = await request.json();
    const parsed = HumanActionPayloadSchema.parse(body);

    const updatedOrder = await applyHumanOrderAction(workspace.id, params.id, {
      ...parsed,
      actorEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to record human order action";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
