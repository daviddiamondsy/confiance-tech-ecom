import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  parseColorsInput,
  parseFeaturesInput,
  parseStorageVariants,
  parseStorageVariantsField,
  primaryYuanFromForm,
} from "@/lib/admin-product-form";
import { isPostgresConfigured } from "@/lib/db/client";
import { ensureCatalogSchema } from "@/lib/db/catalog-schema";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import {
  createAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  type UpdateProductInput,
} from "@/lib/db/products-repository";

function postgresRequired() {
  return NextResponse.json(
    { error: "DATABASE_URL or POSTGRES_URL is required to manage products" },
    { status: 503 }
  );
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const products = await fetchAdminProducts();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const image = String(body.image ?? "").trim();
  const description = String(body.description ?? "").trim();
  const filterSlug = String(body.filterSlug ?? "").trim();
  const yuanRaw = body.yuanCost != null ? String(body.yuanCost).trim() : "";
  const yuanCost = yuanRaw ? Number(yuanRaw) : undefined;
  const badge = body.badge ? String(body.badge).trim() : undefined;
  const storage = body.storage ? String(body.storage).trim() : undefined;
  const colors = parseColorsInput(body.colors);
  const features = parseFeaturesInput(body.features);

  let storageVariants: Array<{ storage: string; yuan: number }> | undefined;
  try {
    storageVariants = parseStorageVariantsField(body.storageVariants);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_STORAGE_VARIANTS") {
      return NextResponse.json(
        {
          error:
            "Storage variants must use storage:yuan on each line (e.g. 512GB:4600)",
        },
        { status: 400 }
      );
    }
    throw error;
  }

  if (!name || !image || !description || !filterSlug) {
    return NextResponse.json(
      { error: "name, image, description, and filterSlug are required" },
      { status: 400 }
    );
  }

  const hasVariants = (storageVariants?.length ?? 0) > 0;
  if (!hasVariants) {
    if (yuanCost == null || !Number.isFinite(yuanCost) || yuanCost <= 0) {
      return NextResponse.json(
        { error: "yuanCost is required when storage variants are not set" },
        { status: 400 }
      );
    }
  } else if (yuanCost != null && (!Number.isFinite(yuanCost) || yuanCost <= 0)) {
    return NextResponse.json({ error: "yuanCost must be a positive number" }, { status: 400 });
  }

  try {
    await ensureCatalogSchema();
    const created = await createAdminProduct({
      name,
      yuanCost,
      image,
      description,
      filterSlug,
      badge,
      storage: hasVariants ? undefined : storage,
      colors,
      features,
      storageVariants,
    });
    const products = await fetchAdminProducts();
    const product = products.find((item) => item.id === created.id);
    return NextResponse.json({ product: product ?? created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_FILTER") {
        return NextResponse.json({ error: "Invalid filter tag" }, { status: 400 });
      }
      if (error.message === "INVALID_YUAN") {
        return NextResponse.json(
          { error: "Set yuan cost or at least one storage:yuan variant" },
          { status: 400 }
        );
      }
    }
    const detail = getPostgresErrorMessage(error);
    console.error("[admin/products] create failed", error);
    return NextResponse.json(
      {
        error: "Could not create product",
        ...(detail ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}

function buildUpdateInput(body: Record<string, unknown>): UpdateProductInput {
  const input: UpdateProductInput = {};

  if (body.name !== undefined) input.name = String(body.name).trim();
  if (body.image !== undefined) input.image = String(body.image).trim();
  if (body.description !== undefined) input.description = String(body.description).trim();
  if (body.filterSlug !== undefined) {
    input.filterSlug =
      body.filterSlug === "" || body.filterSlug == null
        ? ""
        : String(body.filterSlug).trim();
  }
  if (body.badge !== undefined) {
    input.badge = body.badge === "" || body.badge == null ? undefined : String(body.badge).trim();
  }
  if (body.storage !== undefined) {
    input.storage =
      body.storage === "" || body.storage == null ? undefined : String(body.storage).trim();
  }
  if (body.yuanCost !== undefined) {
    const raw = String(body.yuanCost).trim();
    if (raw !== "") {
      const yuanCost = Number(raw);
      if (!Number.isFinite(yuanCost) || yuanCost <= 0) {
        throw new Error("INVALID_YUAN");
      }
      input.yuanCost = yuanCost;
    }
  }
  if (body.colors !== undefined) {
    input.colors = parseColorsInput(body.colors) ?? [];
  }
  if (body.features !== undefined) {
    input.features = parseFeaturesInput(body.features) ?? [];
  }
  if (body.storageVariants !== undefined) {
    input.storageVariants = parseStorageVariantsField(body.storageVariants);
  }

  return input;
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const body = await req.json();
  const productId = String(body.productId ?? "");

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  let input: UpdateProductInput;
  try {
    input = buildUpdateInput(body);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_YUAN") {
        return NextResponse.json({ error: "yuanCost must be a positive number" }, { status: 400 });
      }
      if (error.message === "INVALID_STORAGE_VARIANTS") {
        return NextResponse.json(
          {
            error:
              "Storage variants must use storage:yuan on each line (e.g. 512GB:4600)",
          },
          { status: 400 }
        );
      }
    }
    throw error;
  }

  if (Object.keys(input).length === 0) {
    return NextResponse.json({ error: "No product fields to update" }, { status: 400 });
  }

  try {
    await ensureCatalogSchema();
    const product = await updateAdminProduct(productId, input);
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_FILTER") {
        return NextResponse.json({ error: "Invalid filter tag" }, { status: 400 });
      }
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      if (error.message === "INVALID_YUAN") {
        return NextResponse.json({ error: "yuanCost must be a positive number" }, { status: 400 });
      }
    }
    const detail = getPostgresErrorMessage(error);
    console.error("[admin/products] update failed", error);
    return NextResponse.json(
      {
        error: "Could not update product",
        ...(detail ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
