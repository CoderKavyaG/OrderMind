import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import {
  getProductSku,
  updateProductSku,
  deleteProductSku,
} from "@/server/services/brandSku.service";

const UpdateProductSkuSchema = z.object({
  name: z.string().optional(),
  structure: z.string().optional(),
  dimensions: z.string().optional(),
  materials: z.string().optional(),
  finish: z.string().optional(),
  accessories: z.string().optional(),
  photos: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const product = await getProductSku(workspace.id, params.id);
    if (!product) {
      return NextResponse.json({ error: "Product SKU not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to load product SKU";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = UpdateProductSkuSchema.parse(body);

    const updated = await updateProductSku(workspace.id, params.id, parsed);
    if (!updated) {
      return NextResponse.json({ error: "Product SKU not found" }, { status: 404 });
    }
    return NextResponse.json({ product: updated });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to update product SKU";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspace } = await requireWorkspace();
    const success = await deleteProductSku(workspace.id, params.id);
    if (!success) {
      return NextResponse.json({ error: "Product SKU not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to delete product SKU";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
