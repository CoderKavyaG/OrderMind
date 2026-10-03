import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import {
  getCompanyBrain,
  updateCompanyBrain,
} from "@/server/services/companyBrain.service";
import {
  BrainServiceSchema,
  BrainPriceEntrySchema,
} from "@/server/db/schema";

const UpdateBrainSchema = z.object({
  services: z.array(BrainServiceSchema).optional(),
  priceTable: z.array(BrainPriceEntrySchema).optional(),
  materials: z.array(z.string()).optional(),
  finishes: z.array(z.string()).optional(),
  accessories: z.array(z.string()).optional(),
  policies: z.array(z.string()).optional(),
  outOfScope: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const brain = await getCompanyBrain(workspace.id);
    return NextResponse.json({ brain });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to load company brain";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const updates = UpdateBrainSchema.parse(body);

    const brain = await updateCompanyBrain(workspace.id, updates);
    return NextResponse.json({ brain });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to update company brain";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
