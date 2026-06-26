import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  parseColorsInput,
  parseFeaturesInput,
  parseFilterSlugsInput,
  parseSpecificationsInput,
  parseStorageVariantsField,
} from "@/lib/admin-product-form";
import { isPostgresConfigured } from "@/lib/db/client";
import { ensureCatalogSchema } from "@/lib/db/catalog-schema";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  type UpdateProductInput,
} from "@/lib/db/products-repository";
import {
  defaultShippingForProductName,
  parseChinaShippingYuan,
  parseInternationalShippingNgn,
  type ChinaShippingYuan,
  type InternationalShippingNgn,
} from "@/lib/product-shipping";

function parseProductShippingInput(
  body: Record<string, unknown>,
  productName: string
): { chinaShippingYuan: ChinaShippingYuan; internationalShippingNgn: InternationalShippingNgn } {
  const defaults = defaultShippingForProductName(productName);
  const chinaRaw = body.chinaShippingYuan ?? defaults.chinaShippingYuan;
  const internationalRaw = body.internationalShippingNgn ?? defaults.internationalShippingNgn;

  return {
    chinaShippingYuan: parseChinaShippingYuan(chinaRaw),
    internationalShippingNgn: parseInternationalShippingNgn(internationalRaw),
  };
}

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
  const filterSlugs = parseFilterSlugsInput(body.filterSlugs, body.filterSlug);
  const yuanRaw = body.yuanCost != null ? String(body.yuanCost).trim() : "";
  const yuanCost = yuanRaw ? Number(yuanRaw) : undefined;
  const badge = body.badge ? String(body.badge).trim() : undefined;
  const storage = body.storage ? String(body.storage).trim() : undefined;
  const colors = parseColorsInput(body.colors);
  const features = parseFeaturesInput(body.features);
  const specifications = parseSpecificationsInput(body.specifications);

  let storageVariants: Array<{ storage: string; yuan: number }> | undefined;
  try {
    storageVariants = parseStorageVariantsField(body.storageVariants);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_STORAGE_VARIANTS") {
      return NextResponse.json(
        {
          error:
            "Storage variants must use storage:yuan on each line (e.g. 128GB:1400 and 256GB:1500)",
        },
        { status: 400 }
      );
    }
    throw error;
  }

  if (!name || !image || !description || filterSlugs.length === 0) {
    return NextResponse.json(
      { error: "name, image, description, and at least one filter tag are required" },
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

  let shipping: {
    chinaShippingYuan: ChinaShippingYuan;
    internationalShippingNgn: InternationalShippingNgn;
  };

  try {
    shipping = parseProductShippingInput(body, name);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "INVALID_CHINA_SHIPPING" ||
        error.message === "INVALID_INTERNATIONAL_SHIPPING")
    ) {
      return NextResponse.json({ error: "Invalid shipping option selected" }, { status: 400 });
    }
    throw error;
  }

  try {
    await ensureCatalogSchema();
    const created = await createAdminProduct({
      name,
      yuanCost,
      image,
      description,
      filterSlugs,
      badge,
      storage: hasVariants ? undefined : storage,
      colors,
      features,
      specifications,
      storageVariants,
      ...shipping,
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
      if (
        error.message === "INVALID_CHINA_SHIPPING" ||
        error.message === "INVALID_INTERNATIONAL_SHIPPING"
      ) {
        return NextResponse.json({ error: "Invalid shipping option selected" }, { status: 400 });
      }
      if (error.message === "DUPLICATE_STORAGE_VARIANT") {
        return NextResponse.json(
          { error: "Each storage size must be unique (e.g. 128GB and 256GB, not 128GB twice)." },
          { status: 400 }
        );
      }
      if (error.message === "STORAGE_VARIANT_SYNC_FAILED") {
        return NextResponse.json(
          {
            error:
              "Storage variants did not save correctly. Run Apply schema in admin, then save again.",
          },
          { status: 500 }
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
  if (body.filterSlugs !== undefined || body.filterSlug !== undefined) {
    input.filterSlugs = parseFilterSlugsInput(body.filterSlugs, body.filterSlug);
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
  if (body.specifications !== undefined) {
    const parsed = parseSpecificationsInput(body.specifications);
    if (parsed !== undefined) {
      input.specifications = parsed;
    } else if (typeof body.specifications === "string" && body.specifications.trim() !== "") {
      input.specifications = {};
    }
  }
  if (body.storageVariants !== undefined) {
    input.storageVariants = parseStorageVariantsField(body.storageVariants);
  }
  if (body.chinaShippingYuan !== undefined) {
    input.chinaShippingYuan = parseChinaShippingYuan(body.chinaShippingYuan);
  }
  if (body.internationalShippingNgn !== undefined) {
    input.internationalShippingNgn = parseInternationalShippingNgn(body.internationalShippingNgn);
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
              "Storage variants must use storage:yuan on each line (e.g. 128GB:1400 and 256GB:1500)",
          },
          { status: 400 }
        );
      }
      if (
        error.message === "INVALID_CHINA_SHIPPING" ||
        error.message === "INVALID_INTERNATIONAL_SHIPPING"
      ) {
        return NextResponse.json({ error: "Invalid shipping option selected" }, { status: 400 });
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
      if (error.message === "DUPLICATE_STORAGE_VARIANT") {
        return NextResponse.json(
          { error: "Each storage size must be unique (e.g. 128GB and 256GB, not 128GB twice)." },
          { status: 400 }
        );
      }
      if (error.message === "STORAGE_VARIANT_SYNC_FAILED") {
        return NextResponse.json(
          {
            error:
              "Storage variants did not save correctly. Run Apply schema in admin, then save again.",
          },
          { status: 500 }
        );
      }
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      if (error.message === "INVALID_YUAN") {
        return NextResponse.json({ error: "yuanCost must be a positive number" }, { status: 400 });
      }
      if (
        error.message === "INVALID_CHINA_SHIPPING" ||
        error.message === "INVALID_INTERNATIONAL_SHIPPING"
      ) {
        return NextResponse.json({ error: "Invalid shipping option selected" }, { status: 400 });
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

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const productId = req.nextUrl.searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId query param is required" }, { status: 400 });
  }

  try {
    await deleteAdminProduct(productId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const detail = getPostgresErrorMessage(error);
    console.error("[admin/products] delete failed", error);
    return NextResponse.json(
      {
        error: "Could not delete product",
        ...(detail ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
