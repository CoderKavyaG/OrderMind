import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import {
  updateCustomerMemory,
  deleteCustomerMemory,
} from "@/server/services/customerMemory.service";
import { MemoryKindSchema } from "@/server/db/schema";

const PatchMemorySchema = z.object({
  fact: z.string().optional(),
  kind: MemoryKindSchema.optional(),
  verified: z.boolean().optional(),
  brandId: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = PatchMemorySchema.parse(body);

    const memory = await updateCustomerMemory(workspace.id, params.id, parsed);

    return NextResponse.json({
      success: true,
      memory,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to update memory";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const success = await deleteCustomerMemory(workspace.id, params.id);

    return NextResponse.json({
      success,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to delete memory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
