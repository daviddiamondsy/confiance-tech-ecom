import type { Product } from "@/lib/product-utils";
export type { Product, StorageOption } from "@/lib/product-utils";
export { getSelectedVariant, getDisplaySpecs } from "@/lib/product-utils";
export { productPath, slugifyProductName } from "@/lib/product-slug";
export { priceFromYuan, sellingMarkupForYuan, toCharmPrice } from "@/lib/pricing";

import { catalogProductIdForSlug } from "@/lib/product-slug";
import { isPostgresConfigured } from "@/lib/db/client";
import {
  fetchProductByIdFromDb,
  fetchProductBySlugFromDb,
  fetchProductsFromDb,
} from "@/lib/db/products-repository";

async function resolveDbProductForSlug(slug: string): Promise<Product | undefined> {
  const product = await fetchProductBySlugFromDb(slug);
  if (product) return product;

  const catalogId = catalogProductIdForSlug(slug);
  if (catalogId) {
    return fetchProductByIdFromDb(catalogId);
  }

  return undefined;
}

export async function getProducts(): Promise<Product[]> {
  if (!isPostgresConfigured()) {
    console.warn("[products] DATABASE_URL not set; returning empty catalog");
    return [];
  }

  try {
    return await fetchProductsFromDb();
  } catch (error) {
    console.error("[products] Postgres fetch failed", error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!isPostgresConfigured()) {
    return undefined;
  }

  try {
    const product = await resolveDbProductForSlug(slug);
    if (product) return product;
    return getProductById(slug);
  } catch (error) {
    console.error("[products] Postgres fetch failed for slug", slug, error);
    return undefined;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!isPostgresConfigured()) {
    return undefined;
  }

  try {
    return await fetchProductByIdFromDb(id);
  } catch (error) {
    console.error("[products] Postgres fetch failed for id", id, error);
    return undefined;
  }
}
