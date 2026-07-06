import { describe, expect, it } from "vitest";
import { priceFromYuan, DEFAULT_PRICING_CONFIG } from "@/lib/pricing";
import {
  DEFAULT_LOCAL_DELIVERY_NGN,
  DEFAULT_PRODUCT_SHIPPING,
  INTERNATIONAL_SHIPPING_NGN_OPTIONS,
  LOCAL_DELIVERY_NGN_OPTIONS,
  parseInternationalShippingNgn,
  productShippingFromRow,
  totalShippingNgn,
} from "@/lib/product-shipping";

describe("product-shipping international", () => {
  it("accepts zero international shipping", () => {
    expect(parseInternationalShippingNgn(0)).toBe(0);
    expect(INTERNATIONAL_SHIPPING_NGN_OPTIONS).toContain(0);
  });

  it("includes zero international in total shipping NGN", () => {
    const shipping = {
      ...DEFAULT_PRODUCT_SHIPPING,
      internationalShippingNgn: 0 as (typeof INTERNATIONAL_SHIPPING_NGN_OPTIONS)[number],
    };

    expect(totalShippingNgn(shipping, 207)).toBe(
      shipping.chinaShippingYuan * 207 + shipping.localDeliveryNgn
    );
  });
});

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
