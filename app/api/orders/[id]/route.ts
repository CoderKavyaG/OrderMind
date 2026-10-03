import { NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { getOrderDetails } from "@/server/services/order.service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const order = await getOrderDetails(workspace.id, params.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
