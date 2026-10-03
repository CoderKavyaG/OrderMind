import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { updateOrderType } from "@/server/services/order.service";
import { OrderTypeSchema } from "@/server/db/schema";

const UpdateTypeSchema = z.object({
  orderType: OrderTypeSchema,
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const { orderType } = UpdateTypeSchema.parse(body);

    const updatedOrder = await updateOrderType(workspace.id, params.id, orderType);
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to update order type";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
