import type { Product } from "@/lib/product-utils";

export type ProductCategory = "all" | "iphone" | "macbook";
export type ProductSort = "featured" | "price-asc" | "price-desc" | "name-asc";
export type ProductView = "grid" | "list";

export const PRODUCTS_PAGE_SIZE = 6;

export const CATEGORY_LABELS: Record<Exclude<ProductCategory, "all">, string> = {
  iphone: "iPhone",
  macbook: "MacBook",
};

export const SORT_LABELS: Record<ProductSort, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "name-asc": "Name: A to Z",
};

export function getProductCategory(product: Product): Exclude<ProductCategory, "all"> | null {
  const name = product.name.toLowerCase();
  if (name.includes("macbook")) return "macbook";
  if (name.includes("iphone")) return "iphone";
  return null;
}

export function getAvailableCategories(products: Product[]): ProductCategory[] {
  const categories = new Set<ProductCategory>(["all"]);
  for (const product of products) {
    const category = getProductCategory(product);
    if (category) categories.add(category);
  }
  return Array.from(categories);
}

export function parseProductCategory(value: string | null): ProductCategory {
  if (value === "iphone" || value === "macbook") return value;
  return "all";
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

export function filterProducts(products: Product[], category: ProductCategory): Product[] {
  if (category === "all") return products;
  return products.filter((product) => getProductCategory(product) === category);
}

export function sortProducts(products: Product[], sort: ProductSort): Product[] {
  const copy = [...products];
  switch (sort) {
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
