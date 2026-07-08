import { buildCatalogProducts } from "@/lib/catalog-seed";
import { CATALOG_FILTERS, DEFAULT_PRODUCT_COLORS, catalogFilterSlugsForProduct } from "@/lib/catalog-yuan";
import { isPostgresConfigured } from "@/lib/db/client";
import { ensureIphoneProductCopy } from "@/lib/iphone-product-copy";
import type { Product } from "@/lib/product-utils";
import { slugForProductId } from "@/lib/product-slug";

/** Local dev without Postgres: serve the in-repo static catalog. */
export function shouldUseStaticCatalog(): boolean {
  return process.env.NODE_ENV === "development" && !isPostgresConfigured();
}

let cachedStaticProducts: Product[] | null = null;

/** Drop in-memory static catalog after admin writes (no-op when Postgres is active). */
export function bustStaticCatalogCache(): void {
  cachedStaticProducts = null;
}

export function getStaticCatalogProducts(): Product[] {
  if (!cachedStaticProducts) {
    cachedStaticProducts = buildCatalogProducts().map((product) => {
      const filterSlugs = catalogFilterSlugsForProduct(product.id);
      const filterSlug = CATALOG_FILTERS[product.id];
      const iphoneCopy = ensureIphoneProductCopy({
        name: product.name,
        features: [...(product.features ?? [])],
        specifications: { ...(product.specifications ?? {}) },
      });
      return {
        ...product,
        features: iphoneCopy.features,
        specifications: iphoneCopy.specifications,
        slug: slugForProductId(product.id, product.name),
        filterSlug,
        filterSlugs: filterSlugs.length > 0 ? filterSlugs : undefined,
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
