import { describe, expect, it } from "vitest";
import {
  referralCatalogMeetsMinPurchase,
  referralCatalogMinPurchaseReason,
  referralTierForPrice,
  REFERRAL_MIN_CATALOG_PRICE_NGN,
  REFERRAL_TIERS,
} from "@/lib/referral/config";

// BDD: e-com.md › Feature: Referral Program › tiered referee discount
describe("e-com.md › Referral Program › tier selection", () => {
  it("selects budget tier below mid threshold", () => {
    const tier = referralTierForPrice(400_000);
    expect(tier).not.toBeNull();
    expect(tier!.id).toBe("budget");
    expect(tier!.refereeDiscountNgn).toBeGreaterThan(0);
    expect(tier!.referrerCreditNgn).toBe(tier!.refereeDiscountNgn);
  });

  it("selects mid tier at boundary", () => {
    expect(referralTierForPrice(550_000)?.id).toBe("mid");
  });

  it("selects premium tier for high catalog prices", () => {
    expect(referralTierForPrice(900_000)?.id).toBe("premium");
  });

  it("selects jumbo tier for top band", () => {
    expect(referralTierForPrice(2_000_000)?.id).toBe("jumbo");
  });

  it("keeps referee and referrer rewards equal per tier", () => {
    for (const tier of REFERRAL_TIERS) {
      expect(tier.refereeDiscountNgn).toBe(tier.referrerCreditNgn);
    }
  });
});

// BDD: e-com.md › Feature: Referral Program › minimum catalog purchase floor
describe("e-com.md › Referral Program › minimum purchase floor", () => {
  it("rejects catalog prices below the referral purchase floor", () => {
    expect(referralCatalogMeetsMinPurchase(10_000)).toBe(false);
    expect(referralCatalogMeetsMinPurchase(299_999)).toBe(false);
    expect(referralCatalogMeetsMinPurchase(300_000)).toBe(true);
    expect(referralTierForPrice(10_000)).toBeNull();
  });

  it("surfaces the configured floor in rejection copy", () => {
    expect(referralCatalogMinPurchaseReason()).toContain(
      REFERRAL_MIN_CATALOG_PRICE_NGN.toLocaleString("en-NG")
    );
  });
});
