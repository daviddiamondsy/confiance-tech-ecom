import { describe, expect, it } from "vitest";
import {
  badgeValueForProductUpdate,
  emptyProductForm,
  productFormPayloadForSave,
  resolveAdminPriceModeFromBody,
} from "@/lib/admin-product-form";

describe("productFormPayloadForSave", () => {
  it("clears direct naira fields for supplier-cost products", () => {
    const payload = productFormPayloadForSave({
      ...emptyProductForm,
      useDirectNairaPrice: false,
      yuanCost: "1500",
      directNairaPrice: "850000",
    });

    expect(payload.yuanCost).toBe("1500");
    expect(payload.directNairaPrice).toBe("");
  });

  it("clears supplier cost for direct naira products", () => {
    const payload = productFormPayloadForSave({
      ...emptyProductForm,
      useDirectNairaPrice: true,
      yuanCost: "1500",
      directNairaPrice: "850000",
    });

    expect(payload.yuanCost).toBe("");
    expect(payload.directNairaPrice).toBe("850000");
  });
});

describe("resolveAdminPriceModeFromBody", () => {
  it("prefers the useDirectNairaPrice toggle over priceMode", () => {
    expect(
      resolveAdminPriceModeFromBody({
        useDirectNairaPrice: false,
        priceMode: "direct_ngn",
      })
    ).toBe("calculated");
  });
});

describe("badgeValueForProductUpdate", () => {
  it("trims and keeps non-empty badge labels", () => {
    expect(badgeValueForProductUpdate("  Sale  ")).toBe("Sale");
  });

  it("clears badge when the field is empty or whitespace", () => {
    expect(badgeValueForProductUpdate("")).toBeNull();
    expect(badgeValueForProductUpdate("   ")).toBeNull();
    expect(badgeValueForProductUpdate(null)).toBeNull();
  });
});

describe("productFormPayloadForSave badge", () => {
  it("keeps badge in the save payload", () => {
    const payload = productFormPayloadForSave({
      ...emptyProductForm,
      badge: "Featured",
    });

    expect(payload.badge).toBe("Featured");
  });
});
