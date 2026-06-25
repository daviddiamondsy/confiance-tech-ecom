import type { Product } from "@/lib/product-utils";

export interface HomepageCollectionTag {
  slug: string;
  label: string;
}

/** Brand groupings for homepage rows (not the All Products condition filters). */
export const HOMEPAGE_COLLECTION_TAGS: HomepageCollectionTag[] = [
  { slug: "iphone", label: "iPhone" },
  { slug: "macbook", label: "MacBook" },
  { slug: "samsung", label: "Samsung" },
];

export function getProductBrandSlug(product: Product): string | null {
  const name = product.name.toLowerCase();
  if (name.includes("iphone")) return "iphone";
  if (name.includes("macbook")) return "macbook";
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

/** See more: MacBook → New tab; iPhone/Samsung → Clean + name search. */
export function homepageCollectionHref(brandSlug: string): string {
  if (brandSlug === "macbook") {
    return "/products?category=new";
  }
  if (brandSlug === "iphone") {
    return "/products?category=clean&q=iPhone";
  }
  if (brandSlug === "samsung") {
    return "/products?category=clean&q=Samsung";
  }
  return "/products";
}
