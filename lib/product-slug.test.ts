import { describe, expect, it } from "vitest";

import { CATALOG_SLUGS, resolveStorefrontProductSlug } from "@/lib/product-slug";

describe("resolveStorefrontProductSlug", () => {
  it("prefers the database slug when product id differs from static catalog ids", () => {
    expect(CATALOG_SLUGS["14"]).toBe("samsung-galaxy-s25-ultra");

    expect(
      resolveStorefrontProductSlug({
        id: "14",
        dbSlug: "apple-iphone-13",
        name: "Apple iPhone 13 (Like New)",
      })
    ).toBe("apple-iphone-13");
  });

  it("falls back to catalog slug when database slug is missing", () => {
    expect(
      resolveStorefrontProductSlug({
        id: "6",
        dbSlug: null,
        name: "Apple iPhone 13 (Like New)",
      })
    ).toBe("apple-iphone-13");
  });
});
