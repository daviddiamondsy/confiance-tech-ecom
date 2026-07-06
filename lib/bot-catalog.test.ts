import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Product } from "@/lib/product-utils";

// BDD: e-com.md › Bot catalog API for WhatsApp recommendation wizard

const sampleProducts: Product[] = [
  {
    id: "iphone-15-pro",
    slug: "iphone-15-pro",
    name: "Apple iPhone 15 Pro (New)",
    price: 950000,
    image: "/iphone.jpg",
    description: "Latest iPhone",
    features: ["A17 chip", "USB-C", "Titanium frame", "48MP camera", "Action button"],
    specifications: { Storage: "256GB" },
    storageOptions: [
      { storage: "256GB", price: 950000 },
      { storage: "512GB", price: 1100000 },
    ],
    colorOptions: ["Natural Titanium"],
    filterSlug: "new",
    filterSlugs: ["new", "apple"],
  },
  {
    id: "galaxy-s24",
    slug: "galaxy-s24",
    name: "Samsung Galaxy S24 (Like New)",
    price: 620000,
    image: "/s24.jpg",
    description: "Samsung flagship",
    features: ["AMOLED display", "50MP camera"],
    specifications: { Storage: "256GB" },
    filterSlug: "uk-grade-a",
    filterSlugs: ["uk-grade-a", "samsung"],
  },
];

vi.mock("@/lib/products", () => ({
  getProducts: vi.fn(async () => sampleProducts),
}));

describe("e-com.md › Bot catalog API", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
  });

  it("returns extended fields for recommendation wizard", async () => {
    const { GET } = await import("@/app/api/bot/catalog/route");
    const response = await GET();
    const body = (await response.json()) as {
      products: Array<Record<string, unknown>>;
    };

    expect(body.products).toHaveLength(2);

    const iphone = body.products.find((p) => p.id === "iphone-15-pro");
    expect(iphone).toMatchObject({
      minPrice: 950000,
      brand: "apple",
      filterSlug: "new",
      filterSlugs: ["new", "apple"],
      productUrl: "https://example.test/products/iphone-15-pro",
    });
    expect(iphone?.features).toEqual([
      "A17 chip",
      "USB-C",
      "Titanium frame",
      "48MP camera",
      "Action button",
    ]);

    const samsung = body.products.find((p) => p.id === "galaxy-s24");
    expect(samsung).toMatchObject({
      minPrice: 620000,
      brand: "samsung",
      filterSlug: "uk-grade-a",
    });
  });
});
