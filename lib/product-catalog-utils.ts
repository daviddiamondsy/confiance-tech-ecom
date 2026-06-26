import type { Product } from "@/lib/product-utils";
import type { ProductFilterTag } from "@/lib/product-filter-tags";
import {
  conditionSuffixInName,
  PRODUCT_CONDITION_SUFFIX,
} from "@/lib/product-condition-suffix";
import {
  CLEAN_PRODUCT_FILTER_SLUG,
  NEW_PRODUCT_FILTER_SLUG,
} from "@/lib/product-filter-tags";

export type ProductSort = "featured" | "price-asc" | "price-desc" | "name-asc";
export type ProductView = "grid" | "list";

export const PRODUCTS_PAGE_SIZE = 6;
export const ALL_PRODUCTS_FILTER = "all";

export const SORT_LABELS: Record<ProductSort, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "name-asc": "Name: A to Z",
};

function normalizeCatalogFilterSlug(slug: string): string {
  if (slug === "macbook") return NEW_PRODUCT_FILTER_SLUG;
  if (slug === "iphone" || slug === "samsung") return CLEAN_PRODUCT_FILTER_SLUG;
  return slug;
}

function getLegacyProductFilterSlug(product: Product): string | null {
  if (product.filterSlug) {
    return normalizeCatalogFilterSlug(product.filterSlug);
  }

  const suffix = conditionSuffixInName(product.name);
  if (suffix === PRODUCT_CONDITION_SUFFIX.new) return NEW_PRODUCT_FILTER_SLUG;
  if (suffix === PRODUCT_CONDITION_SUFFIX.clean) return CLEAN_PRODUCT_FILTER_SLUG;

  const name = product.name.toLowerCase();
  if (name.includes("macbook")) return NEW_PRODUCT_FILTER_SLUG;
  if (name.includes("iphone") || name.includes("galaxy") || name.includes("samsung")) {
    return CLEAN_PRODUCT_FILTER_SLUG;
  }

  return null;
}

export function getProductFilterSlugs(product: Product): string[] {
  if (product.filterSlugs?.length) {
    return Array.from(new Set(product.filterSlugs.map(normalizeCatalogFilterSlug)));
  }

  const legacy = getLegacyProductFilterSlug(product);
  return legacy ? [legacy] : [];
}

export function getProductFilterSlug(product: Product): string | null {
  return getProductFilterSlugs(product)[0] ?? null;
}

export function getAvailableFilterSlugs(products: Product[]): string[] {
  const slugs = new Set<string>();
  for (const product of products) {
    for (const slug of getProductFilterSlugs(product)) {
      slugs.add(slug);
    }
  }
  return Array.from(slugs);
}

export function getCatalogFilterOptions(
  products: Product[],
  filterTags: ProductFilterTag[]
): ProductFilterTag[] {
  const usedSlugs = new Set(getAvailableFilterSlugs(products));
  return filterTags.filter((tag) => usedSlugs.has(tag.slug));
}

export function parseCatalogFilter(value: string | null): string {
  if (!value || value === ALL_PRODUCTS_FILTER) return ALL_PRODUCTS_FILTER;
  if (value === "macbook") return NEW_PRODUCT_FILTER_SLUG;
  if (value === "iphone" || value === "samsung") return CLEAN_PRODUCT_FILTER_SLUG;
  return value;
}

export function parseProductSort(value: string | null): ProductSort {
  if (value === "price-asc" || value === "price-desc" || value === "name-asc") return value;
  return "featured";
}

export function parseProductView(value: string | null): ProductView {
  return value === "list" ? "list" : "grid";
}

export function parsePage(value: string | null): number {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export function parseCatalogSearch(value: string | null): string {
  if (!value) return "";
  return value.trim();
}

export function filterProducts(products: Product[], filterSlug: string): Product[] {
  if (filterSlug === ALL_PRODUCTS_FILTER) return products;
  return products.filter((product) => getProductFilterSlugs(product).includes(filterSlug));
}

export const HOME_COLLECTION_SIZE = 4;

function isPopularBadge(badge: string | undefined): boolean {
  return badge?.trim().toLowerCase() === "popular";
}

export function getHomeCollectionProducts(
  products: Product[],
  _groupSlug: string,
  limit = HOME_COLLECTION_SIZE
): { items: Product[]; total: number; hasMore: boolean } {
  const sorted = sortProducts(products, "featured");
  return {
    items: sorted.slice(0, limit),
    total: products.length,
    hasMore: products.length > limit,
  };
}

export function catalogFilterHref(filterSlug: string): string {
  return `/products?category=${encodeURIComponent(filterSlug)}`;
}

export function searchProducts(products: Product[], query: string): Product[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return products;

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.description,
      ...(product.features ?? []),
      product.badge ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortProducts(products: Product[], sort: ProductSort): Product[] {
  const copy = [...products];
  switch (sort) {
    case "featured":
      return copy.sort((a, b) => {
        const aPopular = isPopularBadge(a.badge);
        const bPopular = isPopularBadge(b.badge);
        if (aPopular === bPopular) return 0;
        return aPopular ? -1 : 1;
      });
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return copy;
  }
}

export function paginateProducts<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalItems,
    pageSize,
  };
}

export function getPaginationRange(
  current: number,
  total: number
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const range: Array<number | "ellipsis"> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    const previous = sorted[index - 1];
    if (index > 0 && page - previous > 1) {
      range.push("ellipsis");
    }
    range.push(page);
  }
  return range;
}
