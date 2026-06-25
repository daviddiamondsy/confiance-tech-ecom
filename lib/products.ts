import type { Product } from "@/lib/product-utils";
export type { Product, StorageOption } from "@/lib/product-utils";
export { getSelectedVariant, getDisplaySpecs } from "@/lib/product-utils";
export { productPath, slugifyProductName } from "@/lib/product-slug";
export { priceFromYuan, sellingMarkupForYuan, toCharmPrice } from "@/lib/pricing";

import { buildCatalogProducts } from "@/lib/catalog-seed";
import { CATALOG_FILTERS, DEFAULT_PRODUCT_COLORS } from "@/lib/catalog-yuan";
import { slugForProductId, catalogProductIdForSlug } from "@/lib/product-slug";
import { isPostgresConfigured } from "@/lib/db/client";
import {
  fetchProductByIdFromDb,
  fetchProductBySlugFromDb,
  fetchProductsFromDb,
} from "@/lib/db/products-repository";

const staticProducts = buildCatalogProducts().map((product) => ({
  ...product,
  slug: slugForProductId(product.id, product.name),
  filterSlug: CATALOG_FILTERS[product.id],
  colorOptions: DEFAULT_PRODUCT_COLORS[product.id],
}));

/** Local dev only when DATABASE_URL is not set. Storefront with Postgres uses admin DB only. */
export const products: Product[] = staticProducts;

function staticProductForSlug(slug: string) {
  return staticProducts.find(
    (product) => product.slug === slug || product.id === slug
  );
}

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
    return staticProducts;
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
    return staticProductForSlug(slug);
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
    return staticProducts.find((product) => product.id === id);
  }

  try {
    return await fetchProductByIdFromDb(id);
  } catch (error) {
    console.error("[products] Postgres fetch failed for id", id, error);
    return undefined;
  }
}
