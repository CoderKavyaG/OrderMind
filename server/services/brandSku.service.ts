import { getDb } from "@/server/db/mongodb";
import { Brand, BrandSchema, ProductSku, ProductSkuSchema } from "@/server/db/schema";
import { ObjectId } from "mongodb";

// --- BRANDS ---

export async function listBrands(
  workspaceId: string,
  clientId?: string
): Promise<Array<Brand & { id: string }>> {
  const db = await getDb();
  const query: Record<string, any> = { workspaceId };
  if (clientId) {
    query.clientId = clientId;
  }

  const brands = await db.collection<Brand>("brands").find(query).sort({ createdAt: -1 }).toArray();

  return brands.map((b) => ({
    ...b,
    id: b._id ? b._id.toString() : "",
  }));
}

export async function getBrand(
  workspaceId: string,
  brandId: string
): Promise<(Brand & { id: string }) | null> {
  const db = await getDb();
  let queryId: any = brandId;
  try {
    queryId = new ObjectId(brandId);
  } catch {
    // keep string
  }

  const brand = await db.collection<Brand>("brands").findOne({ _id: queryId, workspaceId });
  if (!brand) return null;
  return {
    ...brand,
    id: brand._id ? brand._id.toString() : brandId,
  };
}

export async function createBrand(
  workspaceId: string,
  input: {
    clientId: string;
    name: string;
    notes?: string;
  }
): Promise<Brand & { id: string }> {
  const db = await getDb();

  // Validate client belongs to workspace
  let queryClientId: any = input.clientId;
  try {
    queryClientId = new ObjectId(input.clientId);
  } catch {
    // keep string
  }

  const client = await db.collection("customers").findOne({ _id: queryClientId, workspaceId });
  if (!client) {
    throw new Error("Client not found or tenant access denied");
  }

  const newBrandDoc: Omit<Brand, "_id" | "id"> = {
    workspaceId,
    clientId: input.clientId,
    name: input.name.trim(),
    notes: input.notes?.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const parsed = BrandSchema.parse(newBrandDoc);
  const result = await db.collection("brands").insertOne(parsed);

  return {
    ...parsed,
    _id: result.insertedId,
    id: result.insertedId.toString(),
  };
}

export async function updateBrand(
  workspaceId: string,
  brandId: string,
  input: Partial<{
    name: string;
    notes: string;
  }>
): Promise<(Brand & { id: string }) | null> {
  const db = await getDb();
  let queryId: any = brandId;
  try {
    queryId = new ObjectId(brandId);
  } catch {
    // keep string
  }

  await db.collection("brands").updateOne(
    { _id: queryId, workspaceId },
    {
      $set: {
        ...input,
        updatedAt: new Date(),
      },
    }
  );

  return getBrand(workspaceId, brandId);
}

export async function deleteBrand(
  workspaceId: string,
  brandId: string
): Promise<boolean> {
  const db = await getDb();
  let queryId: any = brandId;
  try {
    queryId = new ObjectId(brandId);
  } catch {
    // keep string
  }

  const result = await db.collection("brands").deleteOne({ _id: queryId, workspaceId });
  // Also delete associated products
  await db.collection("products").deleteMany({ brandId, workspaceId });

  return (result.deletedCount ?? 0) > 0;
}

// --- PRODUCTS / SKUS ---

export async function listProducts(
  workspaceId: string,
  brandId?: string
): Promise<Array<ProductSku & { id: string }>> {
  const db = await getDb();
  const query: Record<string, any> = { workspaceId };
  if (brandId) {
    query.brandId = brandId;
  }

  const products = await db
    .collection<ProductSku>("products")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return products.map((p) => ({
    ...p,
    id: p._id ? p._id.toString() : "",
  }));
}

export async function getProductSku(
  workspaceId: string,
  skuId: string
): Promise<(ProductSku & { id: string }) | null> {
  const db = await getDb();
  let queryId: any = skuId;
  try {
    queryId = new ObjectId(skuId);
  } catch {
    // keep string
  }

  const product = await db.collection<ProductSku>("products").findOne({ _id: queryId, workspaceId });
  if (!product) return null;
  return {
    ...product,
    id: product._id ? product._id.toString() : skuId,
  };
}

export async function createProduct(
  workspaceId: string,
  input: {
    brandId: string;
    name: string;
    structure: string;
    dimensions: string;
    materials: string;
    finish: string;
    accessories?: string;
    photos?: Array<{ id: string; name: string; url?: string }>;
  }
): Promise<ProductSku & { id: string }> {
  const db = await getDb();

  // Validate brand belongs to workspace
  let queryBrandId: any = input.brandId;
  try {
    queryBrandId = new ObjectId(input.brandId);
  } catch {
    // keep string
  }

  const brand = await db.collection("brands").findOne({ _id: queryBrandId, workspaceId });
  if (!brand) {
    throw new Error("Brand not found or tenant access denied");
  }

  const newProductDoc: Omit<ProductSku, "_id" | "id"> = {
    workspaceId,
    brandId: input.brandId,
    name: input.name.trim(),
    structure: input.structure.trim(),
    dimensions: input.dimensions.trim(),
    materials: input.materials.trim(),
    finish: input.finish.trim(),
    accessories: input.accessories?.trim(),
    photos: input.photos || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const parsed = ProductSkuSchema.parse(newProductDoc);
  const result = await db.collection("products").insertOne(parsed);

  return {
    ...parsed,
    _id: result.insertedId,
    id: result.insertedId.toString(),
  };
}

export async function updateProductSku(
  workspaceId: string,
  skuId: string,
  input: Partial<{
    name: string;
    structure: string;
    dimensions: string;
    materials: string;
    finish: string;
    accessories: string;
    photos: Array<{ id: string; name: string; url?: string }>;
  }>
): Promise<(ProductSku & { id: string }) | null> {
  const db = await getDb();
  let queryId: any = skuId;
  try {
    queryId = new ObjectId(skuId);
  } catch {
    // keep string
  }

  await db.collection("products").updateOne(
    { _id: queryId, workspaceId },
    {
      $set: {
        ...input,
        updatedAt: new Date(),
      },
    }
  );

  return getProductSku(workspaceId, skuId);
}

export async function deleteProductSku(
  workspaceId: string,
  skuId: string
): Promise<boolean> {
  const db = await getDb();
  let queryId: any = skuId;
  try {
    queryId = new ObjectId(skuId);
  } catch {
    // keep string
  }

  const result = await db.collection("products").deleteOne({ _id: queryId, workspaceId });
  return (result.deletedCount ?? 0) > 0;
}

export const createProductSku = createProduct;
export const listProductSkus = listProducts;
