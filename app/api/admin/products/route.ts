import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  badgeValueForProductUpdate,
  parseColorsInput,
  parseFeaturesInput,
  parseFilterSlugsInput,
  parseSpecificationsInput,
  parseStorageVariantsField,
  parseDirectNairaPrice,
  resolveAdminPriceModeFromBody,
} from "@/lib/admin-product-form";
import { parsePriceMode, parseVariantDimension } from "@/lib/variant-dimension";
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
  parseChinaShippingYuan,
  parseInternationalShippingCurrency,
  parseInternationalShippingNgn,
  parseInternationalShippingUsd,
  parseLocalDeliveryNgn,
  parseProductShippingCosts,
  type ProductShippingCosts,
} from "@/lib/product-shipping";
import { parseCostCurrency } from "@/lib/pricing";
import { revalidateStorefrontCatalog } from "@/lib/storefront-revalidation";

function parseProductShippingInput(
  body: Record<string, unknown>,
  productName: string
): ProductShippingCosts {
  return parseProductShippingCosts(body, productName);
}

function isInvalidShippingError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === "INVALID_CHINA_SHIPPING" ||
      error.message === "INVALID_INTERNATIONAL_SHIPPING" ||
      error.message === "INVALID_INTERNATIONAL_SHIPPING_USD" ||
      error.message === "INVALID_INTERNATIONAL_SHIPPING_CURRENCY" ||
      error.message === "INVALID_LOCAL_DELIVERY")
  );
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
  const useDirectNairaPrice = Boolean(body.useDirectNairaPrice);
  const priceMode = parsePriceMode(useDirectNairaPrice ? "direct_ngn" : "calculated");
  const variantDimension = parseVariantDimension(body.variantDimension);
  const valueKind = useDirectNairaPrice ? "naira" : "cost";
  const yuanRaw = body.yuanCost != null ? String(body.yuanCost).trim() : "";
  const yuanCost = yuanRaw ? Number(yuanRaw) : undefined;
  const directNairaPrice = parseDirectNairaPrice(body.directNairaPrice);
  let costCurrency;
  try {
    costCurrency = parseCostCurrency(body.costCurrency ?? "cny");
  } catch {
    return NextResponse.json({ error: "Invalid supplier cost currency" }, { status: 400 });
  }
  const badge = body.badge ? String(body.badge).trim() : undefined;
  const storage = body.storage ? String(body.storage).trim() : undefined;
  const colors = parseColorsInput(body.colors);
  const features = parseFeaturesInput(body.features);
  const specifications = parseSpecificationsInput(body.specifications);

  let storageVariants: Array<{ storage: string; yuan: number }> | undefined;
  try {
    storageVariants = parseStorageVariantsField(body.storageVariants, valueKind);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_STORAGE_VARIANTS") {
      return NextResponse.json(
        {
          error: useDirectNairaPrice
            ? "Variants must use label:price in naira on each line (e.g. 10\":45000)"
            : "Storage variants must use storage:yuan on each line (e.g. 128GB:1400 and 256GB:1500)",
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
  if (useDirectNairaPrice) {
    if (!hasVariants && directNairaPrice == null) {
      return NextResponse.json(
        { error: "Enter a Nigeria price or at least one size:price variant line" },
        { status: 400 }
      );
    }
  } else if (!hasVariants) {
    if (yuanCost == null || !Number.isFinite(yuanCost) || yuanCost <= 0) {
      return NextResponse.json(
        { error: "Supplier cost is required when storage variants are not set" },
        { status: 400 }
      );
    }
  } else if (yuanCost != null && (!Number.isFinite(yuanCost) || yuanCost <= 0)) {
    return NextResponse.json({ error: "Supplier cost must be a positive number" }, { status: 400 });
  }

  let shipping: ProductShippingCosts;

  try {
    shipping = parseProductShippingInput(body, name);
  } catch (error) {
    if (isInvalidShippingError(error)) {
      return NextResponse.json({ error: "Invalid shipping option selected" }, { status: 400 });
    }
    throw error;
  }

  try {
    await ensureCatalogSchema();
    const created = await createAdminProduct({
      name,
      yuanCost,
      directNairaPrice,
      priceMode,
      variantDimension,
      costCurrency,
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
    revalidateStorefrontCatalog(product?.slug ?? created.slug);
    return NextResponse.json({ product: product ?? created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_FILTER") {
        return NextResponse.json({ error: "Invalid filter tag" }, { status: 400 });
      }
      if (error.message === "INVALID_YUAN") {
        return NextResponse.json(
          { error: "Set supplier cost or at least one storage:cost variant" },
          { status: 400 }
        );
      }
      if (error.message === "INVALID_DIRECT_NAIRA") {
        return NextResponse.json(
          { error: "Enter a valid Nigeria price (whole naira, at least 1000)" },
          { status: 400 }
        );
      }
      if (isInvalidShippingError(error)) {
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
    input.badge = badgeValueForProductUpdate(body.badge);
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
    } else {
      input.yuanCost = undefined;
    }
  }
  if (body.useDirectNairaPrice !== undefined) {
    input.priceMode = parsePriceMode(body.useDirectNairaPrice ? "direct_ngn" : "calculated");
  }
  if (
    body.directNairaPrice !== undefined &&
    resolveAdminPriceModeFromBody(body) === "direct_ngn"
  ) {
    const directNairaPrice = parseDirectNairaPrice(body.directNairaPrice);
    if (directNairaPrice == null) {
      throw new Error("INVALID_DIRECT_NAIRA");
    }
    input.directNairaPrice = directNairaPrice;
  }
  if (body.variantDimension !== undefined) {
    input.variantDimension = parseVariantDimension(body.variantDimension);
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
    const valueKind = parsePriceMode(
      body.useDirectNairaPrice ? "direct_ngn" : body.priceMode ?? "calculated"
    ) === "direct_ngn"
      ? "naira"
      : "cost";
    input.storageVariants = parseStorageVariantsField(body.storageVariants, valueKind);
  }
  if (body.costCurrency !== undefined) {
    input.costCurrency = parseCostCurrency(body.costCurrency);
  }
  if (body.chinaShippingYuan !== undefined) {
    input.chinaShippingYuan = parseChinaShippingYuan(body.chinaShippingYuan);
  }
  if (body.internationalShippingCurrency !== undefined) {
    input.internationalShippingCurrency = parseInternationalShippingCurrency(
      body.internationalShippingCurrency
    );
  }
  if (body.internationalShippingNgn !== undefined) {
    input.internationalShippingNgn = parseInternationalShippingNgn(body.internationalShippingNgn);
  }
  if (body.internationalShippingUsd !== undefined) {
    input.internationalShippingUsd = parseInternationalShippingUsd(body.internationalShippingUsd);
  }
  if (body.localDeliveryNgn !== undefined) {
    input.localDeliveryNgn = parseLocalDeliveryNgn(body.localDeliveryNgn);
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
        return NextResponse.json({ error: "Supplier cost must be a positive number" }, { status: 400 });
      }
      if (error.message === "INVALID_DIRECT_NAIRA") {
        return NextResponse.json(
          { error: "Enter a valid Nigeria price (whole naira, at least 1000)" },
          { status: 400 }
        );
      }
      if (error.message === "INVALID_COST_CURRENCY") {
        return NextResponse.json({ error: "Invalid supplier cost currency" }, { status: 400 });
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
      if (isInvalidShippingError(error)) {
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
    revalidateStorefrontCatalog(product.slug);
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
        return NextResponse.json({ error: "Supplier cost must be a positive number" }, { status: 400 });
      }
      if (error.message === "INVALID_DIRECT_NAIRA") {
        return NextResponse.json(
          { error: "Enter a valid Nigeria price (whole naira, at least 1000)" },
          { status: 400 }
        );
      }
      if (error.message === "INVALID_COST_CURRENCY") {
        return NextResponse.json({ error: "Invalid supplier cost currency" }, { status: 400 });
      }
      if (isInvalidShippingError(error)) {
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
    const { slug } = await deleteAdminProduct(productId);
    revalidateStorefrontCatalog(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "DELETE_FAILED") {
      return NextResponse.json(
        { error: "Product could not be removed. Try again or check the database." },
        { status: 500 }
      );
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
