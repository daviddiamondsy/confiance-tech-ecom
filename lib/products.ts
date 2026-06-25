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

/** @deprecated Use getProducts() for server components. */
export const products: Product[] = staticProducts;

function mergeCatalogWithStatic(dbProducts: Product[]): Product[] {
  if (dbProducts.length === 0) return staticProducts;

  const dbIds = new Set(dbProducts.map((product) => product.id));
  const dbSlugs = new Set(dbProducts.map((product) => product.slug));
  const staticOnly = staticProducts.filter(
    (product) => !dbIds.has(product.id) && !dbSlugs.has(product.slug)
  );

  return [...dbProducts, ...staticOnly];
}

export async function getProducts(): Promise<Product[]> {
  if (!isPostgresConfigured()) {
    return staticProducts;
  }

  try {
    const rows = await fetchProductsFromDb();
    return mergeCatalogWithStatic(rows);
  } catch (error) {
    console.error("[products] Postgres fetch failed, using static catalog", error);
    return staticProducts;
  }
}

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

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const staticMatch = staticProductForSlug(slug);
  if (!isPostgresConfigured()) {
    return staticMatch;
  }

  try {
    const product = await resolveDbProductForSlug(slug);
    if (product) return product;

    if (staticMatch) return staticMatch;
    return getProductById(slug);
  } catch (error) {
    console.error("[products] Postgres fetch failed, using static catalog", error);
    return staticMatch ?? staticProducts.find((product) => product.id === slug);
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!isPostgresConfigured()) {
    return staticProducts.find((product) => product.id === id);
  }

  try {
    const product = await fetchProductByIdFromDb(id);
    if (product) return product;
    return staticProducts.find((item) => item.id === id);
  } catch (error) {
    console.error("[products] Postgres fetch failed, using static catalog", error);
    return staticProducts.find((product) => product.id === id);
  }
}
