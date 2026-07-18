import { describe, expect, it } from "vitest";
import {
  storefrontOrderTotalAfterReferral,
  storefrontPriceAfterReferralDiscount,
} from "@/lib/referral/display-price";

// BDD: e-com.md › Feature: Referral Program › Screen: Checkout with referral discount
describe("e-com.md › Referral Program › storefront discount display", () => {
  it("subtracts referee discount from the displayed device price", () => {
    expect(storefrontPriceAfterReferralDiscount(490_000, 10_000)).toBe(480_000);
  });

  it("never goes below zero", () => {
    expect(storefrontPriceAfterReferralDiscount(5_000, 10_000)).toBe(0);
  });

  it("reflects discount in checkout total with door delivery", () => {
    expect(storefrontOrderTotalAfterReferral(490_000, 10_000, 10_000)).toBe(490_000);
  });
});
