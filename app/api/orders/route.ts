import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { listOrders, createDirectOrder } from "@/server/services/order.service";
import { OrderTypeSchema } from "@/server/db/schema";

const CreateOrderSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  brandId: z.string().optional(),
  orderType: OrderTypeSchema.optional(),
  initialTitle: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const sp = request.nextUrl.searchParams;

    const orders = await listOrders(workspace.id, {
      status: sp.get("status") || undefined,
      type: sp.get("type") || undefined,
      stage: sp.get("stage") || undefined,
      search: sp.get("search") || undefined,
      clientId: sp.get("clientId") || undefined,
      brandId: sp.get("brandId") || undefined,
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = CreateOrderSchema.parse(body);

    const order = await createDirectOrder(workspace.id, parsed);

    return NextResponse.json({
      success: true,
      order,
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
