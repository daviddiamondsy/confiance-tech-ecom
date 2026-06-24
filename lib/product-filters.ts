import { isPostgresConfigured } from "@/lib/db/client";
import { fetchProductFiltersFromDb } from "@/lib/db/filters-repository";

export interface ProductFilterTag {
  slug: string;
  label: string;
}

export const DEFAULT_PRODUCT_FILTER_TAGS: ProductFilterTag[] = [
  { slug: "iphone", label: "iPhone" },
  { slug: "macbook", label: "MacBook" },
  { slug: "samsung", label: "Samsung" },
];

export async function getProductFilterTags(): Promise<ProductFilterTag[]> {
  if (!isPostgresConfigured()) {
    return DEFAULT_PRODUCT_FILTER_TAGS;
  }

  try {
    const tags = await fetchProductFiltersFromDb();
    return tags.length > 0 ? tags : DEFAULT_PRODUCT_FILTER_TAGS;
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
