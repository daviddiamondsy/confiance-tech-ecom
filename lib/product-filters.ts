import { isPostgresConfigured } from "@/lib/db/client";
import { fetchProductFiltersFromDb } from "@/lib/db/filters-repository";
import {
  CLEAN_PRODUCT_FILTER_SLUG,
  DEFAULT_PRODUCT_FILTER_TAGS,
  NEW_PRODUCT_FILTER_SLUG,
  type ProductFilterTag,
} from "@/lib/product-filter-tags";

export type { ProductFilterTag } from "@/lib/product-filter-tags";
export {
  CLEAN_PRODUCT_FILTER_SLUG,
  DEFAULT_PRODUCT_FILTER_TAGS,
  NEW_PRODUCT_FILTER_SLUG,
  filterTagLabel,
} from "@/lib/product-filter-tags";

/** Server-only: load filter tags from Postgres. */
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
