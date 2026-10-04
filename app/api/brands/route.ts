import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { listBrands, createBrand } from "@/server/services/brandSku.service";

const CreateBrandSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  name: z.string().min(1, "Name is required"),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId") || undefined;

    const brands = await listBrands(workspace.id, clientId);
    return NextResponse.json({ brands });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to list brands";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = CreateBrandSchema.parse(body);

    const brand = await createBrand(workspace.id, parsed);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to create brand";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
