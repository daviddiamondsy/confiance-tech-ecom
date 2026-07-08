import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/product-utils";
import {
  filterProductsByCollection,
  getHomepageCollectionOptions,
  homepageCollectionHref,
} from "@/lib/homepage-collections";

function product(overrides: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    slug: overrides.id,
    price: 100_000,
    image: "/product-images/test.jpg",
    description: "Test product",
    features: [],
    specifications: {},
    ...overrides,
  };
}

describe("homepage-collections", () => {
  it("shows Accessories after brand rows when tagged products exist", () => {
    const products = [
      product({ id: "1", name: "iPhone 15 (Like New)", filterSlugs: ["clean"] }),
      product({ id: "2", name: "Samsung Galaxy S24 (Like New)", filterSlugs: ["clean"] }),
      product({
        id: "21",
        name: "Apple AirPods 4 (New)",
        filterSlugs: ["new", "accessories"],
      }),
    ];

    expect(getHomepageCollectionOptions(products).map((tag) => tag.slug)).toEqual([
      "apple",
      "samsung",
      "accessories",
    ]);
  });

  it("filters accessories by filter tag, not brand name", () => {
    const products = [
      product({
        id: "21",
        name: "Neewer Ring Light (New)",
        filterSlugs: ["new", "accessories"],
      }),
      product({ id: "1", name: "iPhone 15 (Like New)", filterSlugs: ["clean"] }),
    ];

    expect(filterProductsByCollection(products, "accessories")).toHaveLength(1);
    expect(filterProductsByCollection(products, "accessories")[0]?.name).toContain("Neewer");
  });

  it("links accessories See more to the catalog filter", () => {
    expect(homepageCollectionHref("accessories")).toBe("/products?category=accessories");
  });
});
