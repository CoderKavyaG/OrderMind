import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { getOrderQuote, upsertOrderQuote } from "@/server/services/orderQuote.service";
import { QuoteStatusSchema, QuoteLineItemSchema } from "@/server/db/schema";

const UpsertQuoteSchema = z.object({
  status: QuoteStatusSchema.optional(),
  lineItems: z.array(QuoteLineItemSchema).optional(),
  materialCostINR: z.number().min(0).optional(),
  finishCostINR: z.number().min(0).optional(),
  accessoriesCostINR: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const quote = await getOrderQuote(workspace.id, params.id);
    return NextResponse.json({ success: true, quote });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to load quote";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = UpsertQuoteSchema.parse(body);

    const quote = await upsertOrderQuote(workspace.id, params.id, parsed);
    return NextResponse.json({ success: true, quote });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to update quote";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
