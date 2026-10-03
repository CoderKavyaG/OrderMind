import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { lookupPrice } from "@/server/services/priceLookup.service";

const PriceLookupSchema = z.object({
  category: z.enum(["consultation", "design", "manufacturing"]),
  tierId: z.string(),
  quantity: z.number().optional(),
  skuCount: z.number().optional(),
  months: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = PriceLookupSchema.parse(body);

    const result = await lookupPrice(workspace.id, parsed);
    return NextResponse.json({ result });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Price lookup failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
