import { describe, expect, it } from "vitest";

import {
  STOREFRONT_DOOR_DELIVERY_FEE_NGN,
  storefrontDisplayPrice,
  storefrontDoorDeliveryLineFee,
  storefrontOrderTotal,
  storefrontCatalogIncludesLocalDelivery,
} from "@/lib/storefront-display-price";

describe("storefront-display-price", () => {
  it("keeps direct-naira accessories at full catalog price and adds delivery at checkout", () => {
    const product = { priceMode: "direct_ngn" as const };

    expect(storefrontCatalogIncludesLocalDelivery(product)).toBe(false);
    expect(storefrontDisplayPrice(10_999, product)).toBe(10_999);
    expect(storefrontOrderTotal(10_999, product, true)).toBe(20_999);
    expect(storefrontOrderTotal(10_999, product, false)).toBe(10_999);
    expect(storefrontDoorDeliveryLineFee(product, true)).toBe(
      STOREFRONT_DOOR_DELIVERY_FEE_NGN
    );
  });

  it("strips bundled local delivery from calculated catalog prices", () => {
    const product = { priceMode: "calculated" as const, localDeliveryNgn: 10_000 };

    expect(storefrontCatalogIncludesLocalDelivery(product)).toBe(true);
    expect(storefrontDisplayPrice(449_999, product)).toBe(439_999);
    expect(storefrontOrderTotal(449_999, product, true)).toBe(449_999);
    expect(storefrontOrderTotal(449_999, product, false)).toBe(439_999);
    expect(storefrontDoorDeliveryLineFee(product, true)).toBe(10_000);
  });

  it("does not strip local delivery when catalog was priced without it", () => {
    const product = { priceMode: "calculated" as const, localDeliveryNgn: 0 };

    expect(storefrontDisplayPrice(229_999, product)).toBe(229_999);
    expect(storefrontOrderTotal(229_999, product, true)).toBe(239_999);
    expect(storefrontOrderTotal(229_999, product, false)).toBe(229_999);
  });
});
