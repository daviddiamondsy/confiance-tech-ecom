import { buildCatalogProducts } from "@/lib/catalog-seed";
import { CATALOG_FILTERS, DEFAULT_PRODUCT_COLORS } from "@/lib/catalog-yuan";
import { isPostgresConfigured } from "@/lib/db/client";
import type { Product } from "@/lib/product-utils";
import { slugForProductId } from "@/lib/product-slug";

/** Local dev without Postgres: serve the in-repo static catalog. */
export function shouldUseStaticCatalog(): boolean {
  return process.env.NODE_ENV === "development" && !isPostgresConfigured();
}

let cachedStaticProducts: Product[] | null = null;

export function getStaticCatalogProducts(): Product[] {
  if (!cachedStaticProducts) {
    cachedStaticProducts = buildCatalogProducts().map((product) => {
      const filterSlug = CATALOG_FILTERS[product.id];
      return {
        ...product,
        slug: slugForProductId(product.id, product.name),
        filterSlug,
        filterSlugs: filterSlug ? [filterSlug] : undefined,
        colorOptions: DEFAULT_PRODUCT_COLORS[product.id],
      };
    });
  }
  return cachedStaticProducts;
}

export function getStaticProductBySlug(slug: string): Product | undefined {
  const normalized = slug.trim().toLowerCase();
  return getStaticCatalogProducts().find(
    (product) =>
      product.slug.toLowerCase() === normalized || product.id.toLowerCase() === normalized
  );
}

export function getStaticProductById(id: string): Product | undefined {
  return getStaticCatalogProducts().find((product) => product.id === id);
}
