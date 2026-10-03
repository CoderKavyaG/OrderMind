import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { listProductSkus, createProductSku } from "@/server/services/brandSku.service";

const CreateProductSkuSchema = z.object({
  brandId: z.string().min(1, "brandId is required"),
  name: z.string().min(1, "Name is required"),
  structure: z.string().min(1, "Structure is required"),
  dimensions: z.string().min(1, "Dimensions are required"),
  materials: z.string().min(1, "Materials are required"),
  finish: z.string().min(1, "Finish is required"),
  accessories: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const url = new URL(request.url);
    const brandId = url.searchParams.get("brandId") || undefined;

    const products = await listProductSkus(workspace.id, brandId);
    return NextResponse.json({ products });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to list product SKUs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = CreateProductSkuSchema.parse(body);

    const product = await createProductSku(workspace.id, parsed);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to create product SKU";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
