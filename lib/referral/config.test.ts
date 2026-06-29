import { describe, expect, it } from "vitest";
import { referralTierForPrice, REFERRAL_TIERS } from "@/lib/referral/config";

// BDD: e-com.md › Feature: Referral Program › tiered referee discount
describe("e-com.md › Referral Program › tier selection", () => {
  it("selects budget tier below mid threshold", () => {
    const tier = referralTierForPrice(400_000);
    expect(tier.id).toBe("budget");
    expect(tier.refereeDiscountNgn).toBeGreaterThan(0);
    expect(tier.referrerCreditNgn).toBe(tier.refereeDiscountNgn);
  });

  it("selects mid tier at boundary", () => {
    expect(referralTierForPrice(550_000).id).toBe("mid");
  });

  it("selects premium tier for high catalog prices", () => {
    expect(referralTierForPrice(900_000).id).toBe("premium");
  });

  it("selects jumbo tier for top band", () => {
    expect(referralTierForPrice(2_000_000).id).toBe("jumbo");
  });

  it("keeps referee and referrer rewards equal per tier", () => {
    for (const tier of REFERRAL_TIERS) {
      expect(tier.refereeDiscountNgn).toBe(tier.referrerCreditNgn);
    }
  });
});
