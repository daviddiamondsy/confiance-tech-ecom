import { getProductFilterSlugs } from "@/lib/product-catalog-utils";
import { ACCESSORIES_FILTER_SLUG } from "@/lib/product-filter-tags";
import type { Product } from "@/lib/product-utils";

export interface HomepageCollectionTag {
  slug: string;
  label: string;
}

/** Homepage rows in display order (brand rows, then category rows). */
export const HOMEPAGE_COLLECTION_TAGS: HomepageCollectionTag[] = [
  { slug: "apple", label: "Apple" },
  { slug: "samsung", label: "Samsung" },
  { slug: ACCESSORIES_FILTER_SLUG, label: "Accessories" },
];

const HOMEPAGE_FILTER_COLLECTION_SLUGS = new Set<string>([ACCESSORIES_FILTER_SLUG]);

export function isHomepageFilterCollection(slug: string): boolean {
  return HOMEPAGE_FILTER_COLLECTION_SLUGS.has(slug);
}

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

export function filterProductsByCollection(products: Product[], collectionSlug: string): Product[] {
  if (isHomepageFilterCollection(collectionSlug)) {
    return products.filter((product) => getProductFilterSlugs(product).includes(collectionSlug));
  }
  return filterProductsByBrand(products, collectionSlug);
}

export function getHomepageCollectionOptions(products: Product[]): HomepageCollectionTag[] {
  const usedBrands = new Set(
    products
      .map((product) => getProductBrandSlug(product))
      .filter((slug): slug is string => slug != null)
  );

  return HOMEPAGE_COLLECTION_TAGS.filter((tag) => {
    if (isHomepageFilterCollection(tag.slug)) {
      return filterProductsByCollection(products, tag.slug).length > 0;
    }
    return usedBrands.has(tag.slug);
  });
}

/** See more: brand search or catalog filter on All Products. */
export function homepageCollectionHref(collectionSlug: string): string {
  if (collectionSlug === "apple") {
    return "/products?q=Apple";
  }
  if (collectionSlug === "samsung") {
    return "/products?q=Samsung";
  }
  if (collectionSlug === ACCESSORIES_FILTER_SLUG) {
    return `/products?category=${ACCESSORIES_FILTER_SLUG}`;
  }
  return "/products";
}
