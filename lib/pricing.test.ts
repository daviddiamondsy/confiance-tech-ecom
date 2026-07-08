import { describe, expect, it } from "vitest";

import {
  CHARM_PRICING_MIN_NGN,
  directNairaRawFromStorage,
  sellingPriceFromDirectNaira,
  toCharmPrice,
} from "@/lib/pricing";

describe("toCharmPrice", () => {
  it("keeps amounts below 100k unchanged", () => {
    expect(toCharmPrice(45000)).toBe(45000);
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

  it("applies charm pricing only when selling price is derived", () => {
    expect(sellingPriceFromDirectNaira(45000)).toBe(45000);
    expect(sellingPriceFromDirectNaira(105_000)).toBe(109_999);
  });
});
