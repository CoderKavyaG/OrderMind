import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import {
  transitionLifecycleStage,
  recordStageGateApproval,
} from "@/server/services/order.service";
import { OrderLifecycleStageSchema } from "@/server/db/schema";

const TransitionStageSchema = z.object({
  stage: OrderLifecycleStageSchema,
  note: z.string().optional(),
});

const RecordGateSchema = z.object({
  gate: z.enum(["design_approved", "advance_paid"]),
  note: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace, user } = await requireWorkspace();
    const body = await request.json();
    const { stage, note } = TransitionStageSchema.parse(body);

    const updatedOrder = await transitionLifecycleStage(
      workspace.id,
      params.id,
      stage,
      user.email,
      note
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Stage transition failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace, user } = await requireWorkspace();
    const body = await request.json();
    const { gate, note } = RecordGateSchema.parse(body);

    const updatedOrder = await recordStageGateApproval(
      workspace.id,
      params.id,
      gate,
      user.email,
      note
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Recording stage gate failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
