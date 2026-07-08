/** Client-safe filter tag types and constants (no database imports). */

export interface ProductFilterTag {
  slug: string;
  label: string;
}

export const NEW_PRODUCT_FILTER_SLUG = "new";
export const CLEAN_PRODUCT_FILTER_SLUG = "clean";
export const ACCESSORIES_FILTER_SLUG = "accessories";

export const DEFAULT_PRODUCT_FILTER_TAGS: ProductFilterTag[] = [
  { slug: NEW_PRODUCT_FILTER_SLUG, label: "New" },
  { slug: CLEAN_PRODUCT_FILTER_SLUG, label: "Like New" },
  { slug: ACCESSORIES_FILTER_SLUG, label: "Accessories" },
];

/** Filter tags shown on the All Products page (condition + category tags). */
export const CATALOG_PRODUCT_FILTER_SLUGS = [
  NEW_PRODUCT_FILTER_SLUG,
  CLEAN_PRODUCT_FILTER_SLUG,
  ACCESSORIES_FILTER_SLUG,
] as const;

export function filterTagLabel(
  slug: string,
  filterTags: ProductFilterTag[]
): string {
  return filterTags.find((tag) => tag.slug === slug)?.label ?? slug;
}
