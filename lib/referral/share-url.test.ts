import { describe, expect, it } from "vitest";
import { referralShareUrl } from "@/lib/referral/service";

// BDD: e-com.md › Feature: Referral Program › Screen: Referral landing › product-scoped link
describe("e-com.md › Referral Program › product-scoped share URL", () => {
  it("builds a catalog landing URL by default", () => {
    expect(referralShareUrl("ADA1", "https://shop.example")).toBe("https://shop.example/r/ADA1");
  });

  it("attaches a product slug so the friend lands on that device", () => {
    expect(referralShareUrl("ADA1", "https://shop.example", "iphone-12-pro-max")).toBe(
      "https://shop.example/r/ADA1?product=iphone-12-pro-max"
    );
  });

  it("ignores blank product slugs", () => {
    expect(referralShareUrl("ADA1", "https://shop.example", "  ")).toBe(
      "https://shop.example/r/ADA1"
    );
  });
});
