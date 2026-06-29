import type { Product } from "@/lib/product-utils";
export type { Product, StorageOption } from "@/lib/product-utils";
export { getSelectedVariant, getDisplaySpecs } from "@/lib/product-utils";
export { productPath, slugifyProductName } from "@/lib/product-slug";
export { priceFromYuan, sellingMarkupForYuan, toCharmPrice } from "@/lib/pricing";

import { unstable_noStore as noStore } from "next/cache";
import { catalogProductIdForSlug } from "@/lib/product-slug";
import { isPostgresConfigured } from "@/lib/db/client";
import { ensureCatalogSchema } from "@/lib/db/catalog-schema";
import { isMissingShippingColumnsError } from "@/lib/db/postgres-errors";
import {
  fetchProductByIdFromDb,
  fetchProductBySlugFromDb,
  fetchProductsFromDb,
} from "@/lib/db/products-repository";
import {
  getStaticCatalogProducts,
  getStaticProductById,
  getStaticProductBySlug,
  shouldUseStaticCatalog,
} from "@/lib/static-catalog";

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
  noStore();

  if (shouldUseStaticCatalog()) {
    return getStaticCatalogProducts();
  }

  if (!isPostgresConfigured()) {
    console.warn("[products] DATABASE_URL not set; returning empty catalog");
    return [];
  }

  try {
    return await fetchProductsFromDb();
  } catch (error) {
    if (isMissingShippingColumnsError(error)) {
      try {
        await ensureCatalogSchema();
        return await fetchProductsFromDb();
      } catch (retryError) {
        console.error("[products] Postgres fetch failed after schema migration", retryError);
      }
    } else {
      console.error("[products] Postgres fetch failed", error);
    }
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  noStore();

  if (shouldUseStaticCatalog()) {
    const product = getStaticProductBySlug(slug);
    if (product) return product;

    const catalogId = catalogProductIdForSlug(slug);
    if (catalogId) {
      return getStaticProductById(catalogId);
    }

    return undefined;
  }

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
  noStore();

  if (shouldUseStaticCatalog()) {
    return getStaticProductById(id);
  }

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
