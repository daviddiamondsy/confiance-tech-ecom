import type { Product } from "@/lib/product-utils";

export interface HomepageCollectionTag {
  slug: string;
  label: string;
}

/** Brand groupings for homepage rows (not the All Products condition filters). */
export const HOMEPAGE_COLLECTION_TAGS: HomepageCollectionTag[] = [
  { slug: "apple", label: "Apple" },
  { slug: "samsung", label: "Samsung" },
];

export function getProductBrandSlug(product: Product): string | null {
  const name = product.name.toLowerCase();
  if (name.includes("iphone") || name.includes("macbook") || name.includes("apple")) {
    return "apple";
  }
  if (name.includes("galaxy") || name.includes("samsung")) return "samsung";
  return null;
}

export function filterProductsByBrand(products: Product[], brandSlug: string): Product[] {
  return products.filter((product) => getProductBrandSlug(product) === brandSlug);
}

export function getHomepageCollectionOptions(products: Product[]): HomepageCollectionTag[] {
  const usedBrands = new Set(
    products
      .map((product) => getProductBrandSlug(product))
      .filter((slug): slug is string => slug != null)
  );
  return HOMEPAGE_COLLECTION_TAGS.filter((tag) => usedBrands.has(tag.slug));
}

/** See more: brand search on All Products (New/Clean tabs stay separate). */
export function homepageCollectionHref(brandSlug: string): string {
  if (brandSlug === "apple") {
    return "/products?q=Apple";
  }
  if (brandSlug === "samsung") {
    return "/products?q=Samsung";
  }
  return "/products";
}
