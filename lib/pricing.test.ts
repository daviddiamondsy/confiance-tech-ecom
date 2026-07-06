import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICING_CONFIG,
  priceFromSupplierCost,
  sellingMarkupForSupplierCost,
  wholesaleNgnForTier,
} from "@/lib/pricing";
import { DEFAULT_PRODUCT_SHIPPING } from "@/lib/product-shipping";

describe("priceFromSupplierCost", () => {
  const gbpConfig = {
    ...DEFAULT_PRICING_CONFIG,
    gbpToNaira: 1850,
    expensiveWholesaleNgnThreshold: 724_500,
    expensiveSellingMarkup: 1.15,
    sellingMarkup: 1.2,
  };

  it("matches Cov Tech GBP formula for S25 Ultra 256GB", () => {
    const shipping = {
      chinaShippingYuan: 0 as const,
      internationalShippingNgn: 25_000 as const,
      localDeliveryNgn: 10_000 as const,
    };

    expect(wholesaleNgnForTier(570, "gbp", gbpConfig)).toBe(1_054_500);
    expect(sellingMarkupForSupplierCost(570, "gbp", gbpConfig)).toBe(1.15);
    expect(priceFromSupplierCost(570, "gbp", gbpConfig, shipping)).toBe(1_249_999);
  });

  it("uses standard markup for GBP below wholesale threshold", () => {
    expect(sellingMarkupForSupplierCost(205, "gbp", gbpConfig)).toBe(1.2);
    expect(wholesaleNgnForTier(205, "gbp", gbpConfig)).toBeLessThan(724_500);
  });

  it("includes china shipping for CNY only", () => {
    const withChina = priceFromSupplierCost(1500, "cny", DEFAULT_PRICING_CONFIG, {
      ...DEFAULT_PRODUCT_SHIPPING,
      chinaShippingYuan: 30,
    });
    const withoutChina = priceFromSupplierCost(1500, "cny", DEFAULT_PRICING_CONFIG, {
      ...DEFAULT_PRODUCT_SHIPPING,
      chinaShippingYuan: 0,
    });

    expect(withChina).toBeGreaterThan(withoutChina);
  });

  it("ignores china shipping for USD", () => {
    const withChina = priceFromSupplierCost(400, "usd", DEFAULT_PRICING_CONFIG, {
      ...DEFAULT_PRODUCT_SHIPPING,
      chinaShippingYuan: 30,
    });
    const withoutChina = priceFromSupplierCost(400, "usd", DEFAULT_PRICING_CONFIG, {
      ...DEFAULT_PRODUCT_SHIPPING,
      chinaShippingYuan: 0,
    });

    expect(withChina).toBe(withoutChina);
  });
});
