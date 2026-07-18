import { describe, expect, it } from "vitest";
import { referralShareUrl } from "@/lib/referral/service";
import {
  appendReferralQuery,
  productReferralLandingPath,
  resolveStorefrontReferralShareUrl,
  storefrontReferralShareUrl,
} from "@/lib/referral/product-share-url";

// BDD: e-com.md › Feature: Referral Program › product-scoped share link
describe("e-com.md › Referral Program › storefront referral URLs", () => {
  it("builds a catalog share URL", () => {
    expect(referralShareUrl("AYOBAM52", "https://confiance-tech.vercel.app")).toBe(
      "https://confiance-tech.vercel.app/products?ref=AYOBAM52"
    );
  });

  it("builds a product detail share URL", () => {
    expect(
      storefrontReferralShareUrl("https://confiance-tech.vercel.app", "AYOBAM52", "iphone-12-pro-max")
    ).toBe("https://confiance-tech.vercel.app/products/iphone-12-pro-max?ref=AYOBAM52");
  });

  it("keeps ref when appending to an internal path", () => {
    expect(appendReferralQuery("/products/iphone-12-pro-max", "AYOBAM52")).toBe(
      "/products/iphone-12-pro-max?ref=AYOBAM52"
    );
    expect(appendReferralQuery("/order/iphone-12-pro-max?storage=256GB", "AYOBAM52")).toBe(
      "/order/iphone-12-pro-max?storage=256GB&ref=AYOBAM52"
    );
  });

  it("upgrades legacy /r/CODE links to product detail URLs", () => {
    expect(
      resolveStorefrontReferralShareUrl(
        "https://confiance-tech.vercel.app/r/AYOBAM52",
        "iphone-12-pro-max"
      )
    ).toBe("https://confiance-tech.vercel.app/products/iphone-12-pro-max?ref=AYOBAM52");
  });

  it("returns the storefront product path for landing preview", () => {
    expect(productReferralLandingPath("iphone-12-pro-max")).toBe("/products/iphone-12-pro-max");
  });
});
