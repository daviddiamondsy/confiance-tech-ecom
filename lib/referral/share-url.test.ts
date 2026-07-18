import { describe, expect, it } from "vitest";
import { referralShareUrl } from "@/lib/referral/service";

// BDD: e-com.md › Feature: Referral Program › Screen: Referral landing › product-scoped link
describe("e-com.md › Referral Program › referralShareUrl", () => {
  it("builds a catalog landing URL by default", () => {
    expect(referralShareUrl("ADA1", "https://shop.example")).toBe(
      "https://shop.example/products?ref=ADA1"
    );
  });

  it("builds a product detail URL when slug is provided", () => {
    expect(referralShareUrl("ADA1", "https://shop.example", "iphone-12-pro-max")).toBe(
      "https://shop.example/products/iphone-12-pro-max?ref=ADA1"
    );
  });

  it("ignores blank product slugs", () => {
    expect(referralShareUrl("ADA1", "https://shop.example", "  ")).toBe(
      "https://shop.example/products?ref=ADA1"
    );
  });
});
