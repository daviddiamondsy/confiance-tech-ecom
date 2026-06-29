import { describe, expect, it } from "vitest";
import { priceFromYuan, DEFAULT_PRICING_CONFIG } from "@/lib/pricing";
import {
  DEFAULT_LOCAL_DELIVERY_NGN,
  DEFAULT_PRODUCT_SHIPPING,
  LOCAL_DELIVERY_NGN_OPTIONS,
  productShippingFromRow,
  totalShippingNgn,
} from "@/lib/product-shipping";

describe("product-shipping local delivery", () => {
  it("includes local delivery in total shipping NGN", () => {
    const shipping = {
      ...DEFAULT_PRODUCT_SHIPPING,
      localDeliveryNgn: 15_000 as (typeof LOCAL_DELIVERY_NGN_OPTIONS)[number],
    };

    expect(totalShippingNgn(shipping, 207)).toBe(
      shipping.chinaShippingYuan * 207 + shipping.internationalShippingNgn + 15_000
    );
  });

  it("defaults local delivery to 10000 when column is missing", () => {
    const shipping = productShippingFromRow({
      china_shipping_yuan: 10,
      international_shipping_ngn: 25_000,
    });

    expect(shipping.localDeliveryNgn).toBe(DEFAULT_LOCAL_DELIVERY_NGN);
  });

  it("adds local delivery to selling price", () => {
    const baseShipping = DEFAULT_PRODUCT_SHIPPING;
    const withHigherLocal = {
      ...baseShipping,
      localDeliveryNgn: 20_000 as (typeof LOCAL_DELIVERY_NGN_OPTIONS)[number],
    };

    const basePrice = priceFromYuan(1500, DEFAULT_PRICING_CONFIG, baseShipping);
    const higherLocalPrice = priceFromYuan(1500, DEFAULT_PRICING_CONFIG, withHigherLocal);

    expect(higherLocalPrice).toBeGreaterThan(basePrice);
  });
});
