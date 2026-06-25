import type { Product } from "@/lib/product-utils";

type CatalogProductSeed = Omit<Product, "slug">;

/**
 * Legacy seed hook. Catalog data lives in Postgres (managed via admin).
 * `npm run db:seed` still seeds default filter tags; product rows are not re-imported here.
 */
export function buildCatalogProducts(): CatalogProductSeed[] {
  return [];
}
