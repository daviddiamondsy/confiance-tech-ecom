import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { replaceProductColors } from "@/lib/db/colors-repository";
import { updateProductFilterSlug } from "@/lib/db/filters-repository";
import {
  createAdminProduct,
  fetchAdminProductSummaries,
} from "@/lib/db/products-repository";

function postgresRequired() {
  return NextResponse.json(
    { error: "DATABASE_URL or POSTGRES_URL is required to manage products" },
    { status: 503 }
  );
}

function parseStorageVariants(raw: unknown): Array<{ storage: string; yuan: number }> | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;

  const variants = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [storage, yuanText] = part.split(":").map((value) => value.trim());
      const yuan = Number(yuanText);
      if (!storage || !Number.isFinite(yuan) || yuan <= 0) return null;
      return { storage, yuan };
    })
    .filter((variant): variant is { storage: string; yuan: number } => variant != null);

  return variants.length > 0 ? variants : undefined;
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const products = await fetchAdminProductSummaries();
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
  const yuanCost = Number(body.yuanCost);
  const badge = body.badge ? String(body.badge).trim() : undefined;
  const storage = body.storage ? String(body.storage).trim() : undefined;
  const colors = Array.isArray(body.colors)
    ? body.colors.map((color: unknown) => String(color).trim()).filter(Boolean)
    : typeof body.colors === "string"
      ? body.colors
          .split(",")
          .map((color: string) => color.trim())
          .filter(Boolean)
      : undefined;
  const features =
    typeof body.features === "string"
      ? body.features
          .split("\n")
          .map((feature: string) => feature.trim())
          .filter(Boolean)
      : undefined;
  const storageVariants = parseStorageVariants(body.storageVariants);

  if (!name || !image || !description || !filterSlug) {
    return NextResponse.json(
      { error: "name, image, description, filterSlug, and yuanCost are required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(yuanCost) || yuanCost <= 0) {
    return NextResponse.json({ error: "yuanCost must be a positive number" }, { status: 400 });
  }

  try {
    const product = await createAdminProduct({
      name,
      yuanCost,
      image,
      description,
      filterSlug,
      badge,
      storage,
      colors,
      features,
      storageVariants,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_FILTER") {
      return NextResponse.json({ error: "Invalid filter tag" }, { status: 400 });
    }
    console.error("[admin/products] create failed", error);
    return NextResponse.json({ error: "Could not create product" }, { status: 500 });
  }
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

  if (body.colors !== undefined) {
    if (!Array.isArray(body.colors)) {
      return NextResponse.json({ error: "colors must be an array" }, { status: 400 });
    }
    const updated = await replaceProductColors(productId, body.colors);
    return NextResponse.json({ productId, colors: updated });
  }

  if (body.filterSlug !== undefined) {
    const filterSlug =
      body.filterSlug === "" || body.filterSlug == null ? null : String(body.filterSlug).trim();
    try {
      await updateProductFilterSlug(productId, filterSlug);
      return NextResponse.json({ productId, filterSlug });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_FILTER") {
        return NextResponse.json({ error: "Invalid filter tag" }, { status: 400 });
      }
      throw error;
    }
  }

  return NextResponse.json(
    { error: "Provide colors[] or filterSlug to update a product" },
    { status: 400 }
  );
}
