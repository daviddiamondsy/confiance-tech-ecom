/** Client-safe filter tag types and constants (no database imports). */

export interface ProductFilterTag {
  slug: string;
  label: string;
}

export const NEW_PRODUCT_FILTER_SLUG = "new";
export const CLEAN_PRODUCT_FILTER_SLUG = "clean";

export const DEFAULT_PRODUCT_FILTER_TAGS: ProductFilterTag[] = [
  { slug: NEW_PRODUCT_FILTER_SLUG, label: "New" },
  { slug: CLEAN_PRODUCT_FILTER_SLUG, label: "Clean" },
];

export function filterTagLabel(
  slug: string,
  filterTags: ProductFilterTag[]
): string {
  return filterTags.find((tag) => tag.slug === slug)?.label ?? slug;
}
