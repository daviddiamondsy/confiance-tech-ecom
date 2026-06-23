/** URL slug per legacy catalog id. */
export const CATALOG_SLUGS: Record<string, string> = {
  "6": "iphone-13-256gb",
  "7": "iphone-14-pro-256gb",
  "8": "iphone-15-pro-max",
  "9": "iphone-12-pro-max",
  "10": "iphone-14-pro-max",
  "11": "macbook-pro-m4",
  "12": "iphone-13-pro-max-512gb",
};

/** Build a URL-safe slug from a product name. */
export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(clean\)\s*/gi, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function slugForProductId(id: string, name: string): string {
  return CATALOG_SLUGS[id] ?? slugifyProductName(name);
}

export function productPath(product: { slug: string }): string {
  return `/products/${product.slug}`;
}
