import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Product } from "@/lib/product-utils";

// BDD: e-com.md › Checkout price resolution prefers productId over slug

const iphone13: Product = {
  id: "14",
  slug: "samsung-galaxy-s25-ultra",
  name: "Apple iPhone 13 (Like New)",
  price: 409999,
  image: "/iphone-13.png",
  description: "iPhone 13",
  features: [],
  specifications: {},
  storageOptions: [
    { storage: "128GB", price: 409999 },
    { storage: "256GB", price: 459999 },
  ],
};

const s25Ultra: Product = {
  id: "1",
  slug: "samsung-galaxy-s25-ultra",
  name: "Samsung Galaxy S25 Ultra (Like New)",
  price: 1299999,
  image: "/s25.png",
  description: "S25",
  features: [],
  specifications: {},
  storageOptions: [
    { storage: "256GB", price: 1299999 },
    { storage: "512GB", price: 1319999 },
  ],
};

vi.mock("@/lib/products", () => ({
  getProductById: vi.fn(async (id: string) => {
    if (id === "14") return iphone13;
    if (id === "1") return s25Ultra;
    return undefined;
  }),
  getProductBySlug: vi.fn(async (slug: string) => {
    if (slug === "samsung-galaxy-s25-ultra") return s25Ultra;
    return undefined;
  }),
}));

describe("resolveCheckoutPrice", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("prefers productId when slug resolves to a different product", async () => {
    const { resolveCheckoutPrice } = await import("@/lib/resolve-checkout-price");
    const resolved = await resolveCheckoutPrice({
      productId: "14",
      productSlug: "samsung-galaxy-s25-ultra",
      storage: "256GB",
    });

    expect(resolved).toMatchObject({
      productId: "14",
      productName: "Apple iPhone 13 (Like New)",
      price: 459999,
    });
    expect(console.warn).toHaveBeenCalled();
  });

  it("falls back to slug when productId is missing", async () => {
    const { resolveCheckoutPrice } = await import("@/lib/resolve-checkout-price");
    const resolved = await resolveCheckoutPrice({
      productSlug: "samsung-galaxy-s25-ultra",
      storage: "256GB",
    });

    expect(resolved).toMatchObject({
      productId: "1",
      price: 1299999,
    });
  });
});
