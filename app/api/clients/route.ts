import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { listClients, createClient } from "@/server/services/client.service";

const CreateClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  phone: z.string().optional(),
  email: z.string().optional(),
  instagram: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const clients = await listClients(workspace.id);
    return NextResponse.json({ clients });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to list clients";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = CreateClientSchema.parse(body);

    const client = await createClient(workspace.id, parsed);
    return NextResponse.json({ client }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to create client";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
