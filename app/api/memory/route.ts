import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import {
  listCustomerMemories,
  createCustomerMemory,
} from "@/server/services/customerMemory.service";

const CreateMemorySchema = z.object({
  customerId: z.string().min(1),
  fact: z.string().min(3),
  kind: z.enum(["preference", "shorthand", "pattern"]).default("preference"),
  verified: z.boolean().default(false),
});

export async function GET(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId") || undefined;

    const memories = await listCustomerMemories(workspace.id, customerId);

    return NextResponse.json({
      success: true,
      memories,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load customer memories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = CreateMemorySchema.parse(body);

    const memory = await createCustomerMemory(workspace.id, parsed);

    return NextResponse.json({
      success: true,
      memory,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to create memory";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
