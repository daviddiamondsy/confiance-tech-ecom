import { describe, expect, it } from "vitest";

import {
  parsePriceMode,
  parseVariantDimension,
  variantLinesPlaceholder,
  variantPickerLabel,
  variantSpecKey,
} from "@/lib/variant-dimension";
import {
  parseStorageVariants,
  previewVariantPricesFromForm,
  emptyProductForm,
} from "@/lib/admin-product-form";
import { DEFAULT_PRICING_CONFIG, toCharmPrice } from "@/lib/pricing";

describe("variant dimension helpers", () => {
  it("parses size dimension", () => {
    expect(parseVariantDimension("size")).toBe("size");
    expect(variantSpecKey("size")).toBe("Size");
    expect(variantPickerLabel("size")).toBe("Size");
  });

  it("parses direct naira price mode", () => {
    expect(parsePriceMode("direct_ngn")).toBe("direct_ngn");
    expect(parsePriceMode("calculated")).toBe("calculated");
  });

  it("builds size placeholder for ring lights", () => {
    expect(variantLinesPlaceholder("size", "CNY (¥)", true)).toContain('10"');
  });
});

describe("direct naira variant parsing", () => {
  it("parses size:price lines in naira", () => {
    expect(parseStorageVariants('10":45000\n12":52000', "naira")).toEqual([
      { storage: "10\"", yuan: 45000 },
      { storage: "12\"", yuan: 52000 },
    ]);
  });

  it("previews direct naira with charm pricing", () => {
    const previews = previewVariantPricesFromForm(
      {
        ...emptyProductForm,
        useDirectNairaPrice: true,
        variantDimension: "size",
        storageVariants: '10":45000',
      },
      DEFAULT_PRICING_CONFIG
    );
    expect(previews[0]?.price).toBe(toCharmPrice(45000));
  });
});
