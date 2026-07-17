import { describe, expect, it } from "vitest";

import {
  CHARM_PRICING_MIN_NGN,
  DEFAULT_CHEAP_WHOLESALE_NGN_THRESHOLD,
  DEFAULT_CHEAP_YUAN_THRESHOLD,
  DEFAULT_PRICING_CONFIG,
  directNairaRawFromStorage,
  priceFromSupplierCost,
  sellingMarkupForSupplierCost,
  sellingPriceFromDirectNaira,
  toCharmPrice,
  wholesaleNgnForTier,
} from "@/lib/pricing";
import { DEFAULT_PRODUCT_SHIPPING } from "@/lib/product-shipping";

describe("toCharmPrice", () => {
  it("snaps sub-100k amounts to nearest x999", () => {
    expect(toCharmPrice(43000)).toBe(42999);
    expect(toCharmPrice(45000)).toBe(44999);
    expect(toCharmPrice(99999)).toBe(99999);
  });

  it("snaps amounts at and above 100k to nearest x9999", () => {
    expect(toCharmPrice(CHARM_PRICING_MIN_NGN)).toBe(99999);
    expect(toCharmPrice(104_999)).toBe(99_999);
    expect(toCharmPrice(105_000)).toBe(109_999);
  });
});

describe("direct naira helpers", () => {
  it("reads raw direct naira from storage when present", () => {
    expect(directNairaRawFromStorage(45000, 49999)).toBe(45000);
  });

  it("falls back to stored selling price for legacy rows", () => {
    expect(directNairaRawFromStorage(null, 49999)).toBe(49999);
  });

  it("applies tiered charm pricing when selling price is derived", () => {
    expect(sellingPriceFromDirectNaira(43000)).toBe(42999);
    expect(sellingPriceFromDirectNaira(105_000)).toBe(109_999);
  });
});

describe("priceFromSupplierCost", () => {
  it("converts yuan to naira before charm pricing (yuan amount is not treated as naira)", () => {
    const price = priceFromSupplierCost(
      43_000,
      "cny",
      DEFAULT_PRICING_CONFIG,
      DEFAULT_PRODUCT_SHIPPING
    );

    expect(price).toBeGreaterThan(CHARM_PRICING_MIN_NGN);
    expect(price).not.toBe(42_999);
    expect(price % 10_000).toBe(9999);
  });
});

// BDD: e-com.md › Admin catalog pricing — cheap phones use 1.25 markup below cost thresholds
describe("sellingMarkupForSupplierCost cheap tier (opposite of expensive)", () => {
  it("uses 1.25 markup when CNY cost is below the cheap yuan threshold", () => {
    const yuan = DEFAULT_CHEAP_YUAN_THRESHOLD - 1;
    expect(sellingMarkupForSupplierCost(yuan, "cny", DEFAULT_PRICING_CONFIG)).toBe(1.25);
  });

  it("uses standard 1.2 markup between cheap and expensive yuan thresholds", () => {
    const yuan = DEFAULT_CHEAP_YUAN_THRESHOLD;
    expect(yuan).toBeLessThan(DEFAULT_PRICING_CONFIG.expensiveYuanThreshold!);
    expect(sellingMarkupForSupplierCost(yuan, "cny", DEFAULT_PRICING_CONFIG)).toBe(1.2);
  });

  it("still uses expensive 1.15 markup at or above the expensive yuan threshold", () => {
    expect(sellingMarkupForSupplierCost(3_500, "cny", DEFAULT_PRICING_CONFIG)).toBe(1.15);
  });

  it("uses 1.25 for GBP when wholesale (cost x rate) is below ₦400k", () => {
    const gbp = 200;
    const wholesale = wholesaleNgnForTier(gbp, "gbp", DEFAULT_PRICING_CONFIG);
    expect(wholesale).toBeLessThan(DEFAULT_CHEAP_WHOLESALE_NGN_THRESHOLD);
    expect(sellingMarkupForSupplierCost(gbp, "gbp", DEFAULT_PRICING_CONFIG)).toBe(1.25);
  });

  it("uses standard 1.2 for GBP when wholesale is at or above ₦400k but below expensive", () => {
    const gbp = 220;
    const wholesale = wholesaleNgnForTier(gbp, "gbp", DEFAULT_PRICING_CONFIG);
    expect(wholesale).toBeGreaterThanOrEqual(DEFAULT_CHEAP_WHOLESALE_NGN_THRESHOLD);
    expect(wholesale).toBeLessThan(DEFAULT_PRICING_CONFIG.expensiveWholesaleNgnThreshold!);
    expect(sellingMarkupForSupplierCost(gbp, "gbp", DEFAULT_PRICING_CONFIG)).toBe(1.2);
  });
});
