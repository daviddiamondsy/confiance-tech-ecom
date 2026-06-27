/** URL slug per legacy catalog id. */
export const CATALOG_SLUGS: Record<string, string> = {
  "6": "apple-iphone-13",
  "7": "iphone-14-pro-256gb",
  "8": "iphone-15-pro-max",
  "9": "iphone-12-pro-max",
  "10": "iphone-14-pro-max",
  "11": "macbook-pro-m4",
  "12": "iphone-13-pro-max",
  "13": "samsung-galaxy-s24-ultra",
  "14": "samsung-galaxy-s25-ultra",
  "15": "apple-iphone-12",
};

/** Build a URL-safe slug from a product name. */
export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\((clean|new)\)\s*/gi, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function slugForProductId(id: string, name: string): string {
  return CATALOG_SLUGS[id] ?? slugifyProductName(name);
}

/** Resolve a legacy catalog URL slug (e.g. iphone-13-256gb) to a catalog product id. */
export function catalogProductIdForSlug(slug: string): string | undefined {
  const normalized = slug.trim().toLowerCase();
  for (const [id, catalogSlug] of Object.entries(CATALOG_SLUGS)) {
    if (catalogSlug === normalized || id === normalized) {
      return id;
    }
  }
  return undefined;
}

export function productPath(product: { slug: string }): string {
  return `/products/${product.slug}`;
}
