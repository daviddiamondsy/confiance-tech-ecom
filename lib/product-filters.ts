import { isPostgresConfigured } from "@/lib/db/client";
import { fetchProductFiltersFromDb } from "@/lib/db/filters-repository";

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

export async function getProductFilterTags(): Promise<ProductFilterTag[]> {
  if (!isPostgresConfigured()) {
    return DEFAULT_PRODUCT_FILTER_TAGS;
  }

  try {
    const tags = await fetchProductFiltersFromDb();
    const conditionTags = tags.filter((tag) =>
      [NEW_PRODUCT_FILTER_SLUG, CLEAN_PRODUCT_FILTER_SLUG].includes(tag.slug)
    );
    return conditionTags.length > 0 ? conditionTags : DEFAULT_PRODUCT_FILTER_TAGS;
  } catch (error) {
    console.error("[product-filters] fetch failed, using defaults", error);
    return DEFAULT_PRODUCT_FILTER_TAGS;
  }
}

export function filterTagLabel(
  slug: string,
  filterTags: ProductFilterTag[]
): string {
  return filterTags.find((tag) => tag.slug === slug)?.label ?? slug;
}
