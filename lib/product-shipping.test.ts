import { describe, expect, it } from "vitest";
import { priceFromYuan, DEFAULT_PRICING_CONFIG } from "@/lib/pricing";
import {
  DEFAULT_LOCAL_DELIVERY_NGN,
  DEFAULT_PRODUCT_SHIPPING,
  INTERNATIONAL_SHIPPING_NGN_OPTIONS,
  INTERNATIONAL_SHIPPING_USD_OPTIONS,
  LOCAL_DELIVERY_NGN_OPTIONS,
  internationalShippingAmountNgn,
  parseInternationalShippingNgn,
  parseInternationalShippingUsd,
  productShippingFromRow,
  totalShippingNgn,
} from "@/lib/product-shipping";

describe("product-shipping international", () => {
  it("accepts zero international shipping", () => {
    expect(parseInternationalShippingNgn(0)).toBe(0);
    expect(INTERNATIONAL_SHIPPING_NGN_OPTIONS).toContain(0);
  });

  it("accepts USD international shipping options", () => {
    expect(parseInternationalShippingUsd(15)).toBe(15);
    expect(INTERNATIONAL_SHIPPING_USD_OPTIONS).toContain(0);
  });

  it("converts USD international shipping to NGN", () => {
    const shipping = {
      ...DEFAULT_PRODUCT_SHIPPING,
      internationalShippingCurrency: "usd" as const,
      internationalShippingUsd: 15 as (typeof INTERNATIONAL_SHIPPING_USD_OPTIONS)[number],
    };

    expect(internationalShippingAmountNgn(shipping, 1650)).toBe(24_750);
  });

  it("includes zero international in total shipping NGN", () => {
    const shipping = {
      ...DEFAULT_PRODUCT_SHIPPING,
      internationalShippingNgn: 0 as (typeof INTERNATIONAL_SHIPPING_NGN_OPTIONS)[number],
    };

    expect(totalShippingNgn(shipping, 207, 1650)).toBe(
      shipping.chinaShippingYuan * 207 + shipping.localDeliveryNgn
    );
  });

  it("includes USD international in total shipping NGN", () => {
    const shipping = {
      ...DEFAULT_PRODUCT_SHIPPING,
      internationalShippingCurrency: "usd" as const,
      internationalShippingUsd: 25 as (typeof INTERNATIONAL_SHIPPING_USD_OPTIONS)[number],
    };

    expect(totalShippingNgn(shipping, 207, 1650)).toBe(
      shipping.chinaShippingYuan * 207 + 25 * 1650 + shipping.localDeliveryNgn
    );
  });
});

describe("product-shipping local delivery", () => {
  it("includes local delivery in total shipping NGN", () => {
    const shipping = {
      ...DEFAULT_PRODUCT_SHIPPING,
      localDeliveryNgn: 15_000 as (typeof LOCAL_DELIVERY_NGN_OPTIONS)[number],
    };

    expect(totalShippingNgn(shipping, 207, 1650)).toBe(
      shipping.chinaShippingYuan * 207 +
        shipping.internationalShippingNgn +
        15_000
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
